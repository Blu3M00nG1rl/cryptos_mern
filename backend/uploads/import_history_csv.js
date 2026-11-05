require('dotenv').config({ path: '../config/.env' });
const axios = require('axios');

const connectDB = require("../config/db");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const History = require("../models/history.model");
const Coin = require("../models/coin.model");
const CoinsNonImporte = require("../models/coins_non_importe.model");
const writeLog = require("../utils/logger");

const historiquePath = path.join(__dirname, "../storage/historique");

const deleteCoinsNI = async () => {
    const endpoint = process.env.API_URL + "/coins_non_importe/delete";
    try {
        await axios.delete(endpoint);
        writeLog("Suppression coins_non_importes réussie");
    } catch (error) {
        writeLog("Erreur lors de suppression des coins non importés :", error.message);
    }
}

const runImport = async () => {
    writeLog("=== DEBUT IMPORT HISTORIQUE ===");
    //writeLog("HISTORY BITCOIN PATH: " + path.join(__dirname, "../storage/historique/btc.csv"));
    await connectDB();
    await deleteCoinsNI();

    // 🔥 Récupération du taux USD → EUR (comme dans import.js)
    const fxRes = await axios.get('https://api.frankfurter.app/latest?from=USD&to=EUR');
    const usdToEur = fxRes.data.rates.EUR;

    if (!usdToEur) {
        writeLog(`❌ Impossible de récupérer le taux USD/EUR`);
        return;
    }

    writeLog("Taux USD → EUR :", usdToEur);


    const limiteDate = new Date();
    limiteDate.setDate(limiteDate.getDate() - 260);

    const files = fs.readdirSync(historiquePath)
        .filter(file => {
            const stats = fs.statSync(path.join(historiquePath, file));
            return stats.mtime > limiteDate;
        });

    const filesAll = fs.readdirSync(historiquePath);

    // 🔍 Liste des symbols présents dans les fichiers CSV
    const symbolsInFiles = filesAll.map(f => f.replace(".csv", ""));
    const symbolsInFilesLower = symbolsInFiles.map(s => s.toLowerCase());

    // 🔍 Liste des symbols présents dans la collection coins
    const allCoins = await Coin.find().select("symbol").lean();
    const symbolsInDB = allCoins.map(c => c.symbol);

    // 🔥 Comparaison insensible à la casse
    const missingSymbols = symbolsInDB.filter(
        sym => !symbolsInFilesLower.includes(sym.toLowerCase())
    );

    writeLog("Coins sans historique :", missingSymbols);

    // 📝 Ajout dans coins_non_importes
    for (const symbol of missingSymbols) {
        await CoinsNonImporte.updateOne(
            { symbol },
            { $set: { symbol } },
            { upsert: true }
        );
    }

    writeLog(`📌 ${missingSymbols.length} coins ajoutés dans coins_non_importes`);
    writeLog(`Fichiers trouvés: ${files.length}`);
    let importedCount = 0;

    for (const file of files) {
        const symbol = file.replace(".csv", "");

        writeLog(`📂 Traitement de ${file}`);

        // Recherche du coin
        const coin = await Coin.findOne({ symbol }).lean();

        if (!coin) {
            writeLog(`❌ Aucun coin trouvé pour le symbole : ${symbol}`);
            continue;
        }

        const results = [];

        await new Promise((resolve, reject) => {

            fs.createReadStream(path.join(historiquePath, file))
                .pipe(csv())

                .on("data", (row) => {

                    try {

                        const keys = Object.keys(row);

                        const dateCol =
                            keys.includes("snapped_at") ? "snapped_at" :
                                keys.includes("event_date") ? "event_date" :
                                    keys[0];

                        const rawDate = row[dateCol];

                        // Détermination du prix
                        const prixBrut =
                            row.close_price_usd ??
                            row.price;

                        if (!prixBrut) {
                            writeLog(
                                `⚠️ ${file} : prix absent (${rawDate})`
                            );
                            return;
                        }

                        let journee = null;

                        if (rawDate && rawDate !== "NULL") {

                            // Format : 2026-10-25 00:00:00 UTC
                            if (/^\d{4}-\d{2}-\d{2}/.test(rawDate)) {

                                journee = new Date(
                                    rawDate.replace(" UTC", "Z")
                                );

                            } else {

                                // Format : Oct 25, 2026
                                const months = {
                                    Jan: 0,
                                    Feb: 1,
                                    Mar: 2,
                                    Apr: 3,
                                    May: 4,
                                    Jun: 5,
                                    Jul: 6,
                                    Aug: 7,
                                    Sep: 8,
                                    Oct: 9,
                                    Nov: 10,
                                    Dec: 11
                                };

                                const [month, day, year] =
                                    rawDate.replace(",", "").split(" ");

                                journee = new Date(
                                    Date.UTC(
                                        Number(year),
                                        months[month],
                                        Number(day)
                                    )
                                );
                            }
                        }

                        if (!journee || isNaN(journee.getTime())) {
                            writeLog(
                                `❌ ${file} : date invalide "${rawDate}"`
                            );
                            return;
                        }

                        const prix = Number(
                            prixBrut.toString().replace(/,/g, "")
                        );

                        if (isNaN(prix)) {
                            writeLog(
                                `❌ ${file} : prix invalide "${prixBrut}"`
                            );
                            return;
                        }

                        const totalVolumeBrut =
                            row.total_volume ?? row.volume_usd;

                        let total_volume = null;

                        if (
                            totalVolumeBrut !== undefined &&
                            totalVolumeBrut !== null &&
                            totalVolumeBrut !== ""
                        ) {
                            const volume = Number(
                                totalVolumeBrut.toString().replace(/,/g, "")
                            );

                            if (!isNaN(volume)) {
                                total_volume = volume;
                            } else {
                                writeLog(
                                    `❌ ${file} volume invalide : ${totalVolumeBrut}`
                                );
                            }
                        }

                        results.push({
                            coinId: coin.coinId,
                            journee,
                            prix: prix * usdToEur,
                            total_volume
                        });

                    } catch (err) {

                        writeLog(
                            `❌ ${file} : erreur ligne CSV : ${err.message}`
                        );

                        writeLog(
                            JSON.stringify(row)
                        );
                    }
                })

                .on("end", async () => {

                    try {

                        writeLog(
                            `✅ ${file} à mettre à jour (${results.length} lignes)`
                        );

                        if (results.length === 0) {
                            writeLog(
                                `⚠️ ${file} : aucune donnée exploitable`
                            );
                            return resolve();
                        }

                        const bulkOps = results.map(row => ({
                            updateOne: {
                                filter: {
                                    coinId: row.coinId,
                                    journee: row.journee
                                },
                                update: {
                                    $set: row
                                },
                                upsert: true
                            }
                        }));

                        const bulkResult = await History.bulkWrite(
                            bulkOps,
                            { ordered: false }
                        );

                        writeLog(
                            `✅ ${file}: ${results.length} lignes importées/mises à jour`
                        );

                        resolve();

                    } catch (err) {

                        writeLog(
                            `❌ Erreur import ${file}: ${err.stack}`
                        );

                        resolve();
                    }
                })

                .on("error", err => {

                    writeLog(
                        `❌ Erreur lecture ${file}: ${err.stack}`
                    );

                    reject(err);
                });
        });
    }

    writeLog("=== FIN IMPORT HISTORIQUE ===");
};

async function runImportHistory() {
    try {
        await runImport();
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    } finally {
        await mongoose.connection.close();
    }
}

module.exports = runImportHistory;