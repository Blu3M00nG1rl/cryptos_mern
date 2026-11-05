require('dotenv').config({ path: '../config/.env' });
const axios = require('axios');

const connectDB = require("../config/db");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const History = require("../models/history.model");
const Coin = require("../models/coin.model");
const CoinsNonImporte = require("../models/coins_non_importe.model");
const writeLog = require("../utils/logger");

const historiquePath = path.join(__dirname, "../storage/html");

const deleteCoinsNI = async () => {
    const endpoint = process.env.API_URL + "/coins_non_importe/delete";
    try {
        const response = await axios.delete(endpoint);
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
    limiteDate.setDate(limiteDate.getDate() - 2);

    const files = fs.readdirSync(historiquePath)
        .filter(file => {
            const stats = fs.statSync(path.join(historiquePath, file));
            return stats.mtime > limiteDate;
        });

    const filesAll = fs.readdirSync(historiquePath);

    // 🔍 Liste des symbols présents dans les fichiers HTML
    const symbolsInFiles = filesAll.map(f => f.replace(".html", ""));
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
        const symbol = file.replace(".html", "");

        writeLog(`📂 Traitement de ${file}`);

        // Recherche du coin
        const coin = await Coin.findOne({ symbol }).lean();

        if (!coin) {
            writeLog(`❌ Aucun coin trouvé pour le symbole : ${symbol}`);
            continue;
        }

        const html = fs.readFileSync(
            path.join(historiquePath, file),
            "utf8"
        );

        const $ = cheerio.load(html);

        const results = [];

        $("table tbody tr").each((index, element) => {

            try {

                const tds = $(element).find("td");

                if (tds.length < 7) {
                    return;
                }

                // Colonne 1
                const rawDate = $(tds[0]).text().trim();

                // Colonne 6 (Adj Close)
                const rawPrice = $(tds[5]).text().trim();

                // Colonne 7 (Volume)
                const rawVolume = $(tds[6]).text().trim();

                if (!rawPrice) {
                    writeLog(
                        `⚠️ ${file} : prix absent (${rawDate})`
                    );
                    return;
                }

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

                const journee = new Date(
                    Date.UTC(
                        Number(year),
                        months[month],
                        Number(day)
                    )
                );

                if (isNaN(journee.getTime())) {
                    writeLog(
                        `❌ ${file} : date invalide "${rawDate}"`
                    );
                    return;
                }

                const prix = Number(
                    rawPrice.replace(/,/g, "")
                );

                if (isNaN(prix)) {
                    writeLog(
                        `❌ ${file} : prix invalide "${rawPrice}"`
                    );
                    return;
                }

                let total_volume = null;

                if (rawVolume) {

                    const volume = Number(
                        rawVolume.replace(/,/g, "")
                    );

                    if (!isNaN(volume)) {
                        total_volume = volume;
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
                    `❌ ${file} : ${err.message}`
                );
            }
        });

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

            await History.bulkWrite(
                bulkOps,
                { ordered: false }
            );

            writeLog(
                `✅ ${file}: ${results.length} lignes importées/mises à jour`
            );

        } catch (err) {

            writeLog(
                `❌ Erreur import ${file}: ${err.stack}`
            );

            resolve();
        }
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