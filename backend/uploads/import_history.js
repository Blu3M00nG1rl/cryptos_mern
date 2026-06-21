require('dotenv').config({ path: '../config/.env' });
const axios = require('axios');

const connectDB = require("../config/db");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const History = require("../models/history.model");
const Coin = require("../models/coin.model"); // <-- AJOUT
const CoinsNonImporte = require("../models/coins_non_importe.model");

const historiquePath = path.join(__dirname, "../storage/historique");

const deleteCoinsNI = async () => {
    const endpoint = process.env.API_URL + "/coins_non_importe/delete";
    try {
        const response = await axios.delete(endpoint);
        console.log("Suppression coins_non_importes réussie");
    } catch (error) {
        console.log("Erreur lors de suppréssion des coins non importés :", error.message);
    }
}

const runImport = async () => {
    console.log("=== DEBUT IMPORT HISTORIQUE ===");
    await connectDB();
    await deleteCoinsNI();

    // 🔥 Récupération du taux USD → EUR (comme dans import.js)
    const fxRes = await axios.get('https://api.frankfurter.app/latest?from=USD&to=EUR');
    const usdToEur = fxRes.data.rates.EUR;

    if (!usdToEur) {
        console.error("❌ Impossible de récupérer le taux USD/EUR");
        mongoose.connection.close();
        return;
    }

    console.log("Taux USD → EUR :", usdToEur);

    const files = fs.readdirSync(historiquePath).filter(f => f.endsWith("-usd-max.csv"));
    // 🔍 Liste des symbols présents dans les fichiers CSV
    const symbolsInFiles = files.map(f => f.replace("-usd-max.csv", ""));

    // 🔍 Liste des symbols présents dans la collection coins
    const allCoins = await Coin.find().select("symbol").lean();
    const symbolsInDB = allCoins.map(c => c.symbol);

    // 🔥 Symbols présents dans coins mais absents des fichiers CSV
    const missingSymbols = symbolsInDB.filter(sym => !symbolsInFiles.includes(sym));

    console.log("Coins sans historique :", missingSymbols);
    

    // 📝 Ajout dans coins_non_importes
    for (const symbol of missingSymbols) {
        await CoinsNonImporte.updateOne(
            { symbol },
            { $set: { symbol } },
            { upsert: true }
        );
    }

    console.log(`📌 ${missingSymbols.length} coins ajoutés dans coins_non_importes`);
    console.log(`Fichiers trouvés: ${files.length}`);
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
                    results.push({
                        coinId: coin.coinId, // <-- UTILISATION DU coinId DE LA COLLECTION COINS
                        journee: row.snapped_at === "NULL" ? null : new Date(row.snapped_at),
                        prix: row.price === "NULL" ? null : Number(row.price) * usdToEur,
                        market_cap: row.market_cap === "NULL" ? null : Number(row.market_cap),
                        total_volume: row.total_volume === "NULL" ? null : Number(row.total_volume)
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
                        console.log(`✅ ${file}: ${results.length} lignes importées/mises à jour`);
                        resolve();
                    } catch (err) {
                        console.error(`❌ Erreur import ${file}:`, err.message);
                        resolve();
                    }
                })
                .on("error", reject);
        });
    }

    mongoose.connection.close();
    console.log("Import terminé");
    console.log("=== FIN IMPORT HISTORIQUE ===");
    console.log(`IMPORTED_COUNT=${importedCount}`);
};

runImport().catch(err => {
    console.error("Erreur:", err);
    mongoose.connection.close();
});
