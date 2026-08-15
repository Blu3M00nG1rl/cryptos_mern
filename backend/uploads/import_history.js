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
        const response = await axios.delete(endpoint);
        writeLog("Suppression coins_non_importes réussie");
    } catch (error) {
        writeLog("Erreur lors de suppression des coins non importés :", error.message);
    }
}

const runImport = async () => {
    writeLog("=== DEBUT IMPORT HISTORIQUE ===");
    writeLog("HISTORY BITCOIN PATH: " + path.join(__dirname, "../storage/historique/btc-usd-max.csv"));
    await connectDB();
    await deleteCoinsNI();

    // 🔥 Récupération du taux USD → EUR (comme dans import.js)
    const fxRes = await axios.get('https://api.frankfurter.app/latest?from=USD&to=EUR');
    const usdToEur = fxRes.data.rates.EUR;

    if (!usdToEur) {
        console.error("❌ Impossible de récupérer le taux USD/EUR");
        return;
    }

    writeLog("Taux USD → EUR :", usdToEur);

    const files = fs.readdirSync(historiquePath).filter(f => f.endsWith("-usd-max.csv"));
    // 🔍 Liste des symbols présents dans les fichiers CSV
    const symbolsInFiles = files.map(f => f.replace("-usd-max.csv", ""));
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
        const symbol = file.replace("-usd-max.csv", "");

        // 🔍 Récupération du coin dans la base
        const coin = await Coin.findOne({ symbol }).lean();
        if (!coin) {
            console.error(`❌ Aucun coin trouvé pour le symbole : ${symbol}`);
            continue;
        }

        const results = [];

        await new Promise((resolve, reject) => {
            fs.createReadStream(path.join(historiquePath, file))
                .pipe(csv())
                .on("data", (row) => {

                    const keys = Object.keys(row);

                    const dateCol =
                        keys.includes("snapped_at") ? "snapped_at" :
                            keys.includes("event_date") ? "event_date" :
                                keys[0];

                    const rawDate = row[dateCol];
                    const journee = (!rawDate || rawDate === "NULL") ? null : new Date(rawDate);

                    results.push({
                        coinId: coin.coinId,
                        journee,
                        prix: row.price ? Number(row.price) * usdToEur :
                            row.close_price_usd ? Number(row.close_price_usd) * usdToEur :
                                null,
                        market_cap: row.market_cap ? Number(row.market_cap) :
                            row.market_cap_usd ? Number(row.market_cap_usd) :
                                null,
                        total_volume: row.total_volume ? Number(row.total_volume) :
                            row.volume_usd ? Number(row.volume_usd) :
                                null
                    });
                })
                .on("end", async () => {
                    try {
                        const bulkOps = results.map(row => ({
                            updateOne: {
                                filter: { coinId: row.coinId, journee: row.journee },
                                update: { $set: row },
                                upsert: true
                            }
                        }));

                        await History.bulkWrite(bulkOps, { ordered: false });
                        importedCount += results.length;
                        writeLog(`✅ ${file}: ${results.length} lignes importées/mises à jour`);
                        resolve();
                    } catch (err) {
                        console.error(`❌ Erreur import ${file}:`, err.message);
                        resolve();
                    }
                })
                .on("error", reject);
        });
    }

    writeLog("Import terminé");
    writeLog("=== FIN IMPORT HISTORIQUE ===");
    writeLog(`IMPORTED_COUNT=${importedCount}`);
};

async function runImportHistory() {
    try {
        const result = await runImport();
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

module.exports = runImportHistory;





