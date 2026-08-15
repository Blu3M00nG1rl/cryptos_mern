require('dotenv').config({ path: '../config/.env' });
const connectDB = require("../config/db");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const writeLog = require("../utils/logger");
const Bitcoin = require("../models/bitcoin.model");

const bitcoinPath = path.join(__dirname, "../storage/historique/btc-usd-max.csv");

//
// 🔥 IMPORT CSV
//

async function runImport() {
    let importedCount = 0;
    const results = [];

    await new Promise((resolve, reject) => {
        fs.createReadStream(bitcoinPath)
            .pipe(csv())
            .on("data", (row) => {
                // event_date, close_price_usd, market_cap_usd, volume_usd

                if (!row.close_price_usd || row.close_price_usd.trim() === "") {
                    // Ligne sans prix → on l'ignore
                    return;
                }

                const date = new Date(row.event_date.replace(" UTC", "Z"));
                if (isNaN(date.getTime())) {
                    writeLog("Date invalide :", row.event_date);
                    return;
                }

                const prix = Number(row.close_price_usd);

                results.push({
                    dateCours: date,
                    prix,
                    market_cap: row.market_cap_usd ? Number(row.market_cap_usd) : null,
                    volume: row.volume_usd ? Number(row.volume_usd) : null
                });
            })

            .on("end", async () => {
                try {
                    await Bitcoin.insertMany(results, { ordered: false });

                    importedCount = results.length;
                    writeLog(`→ ${results.length} lignes insérées`);

                    resolve();
                } catch (err) {
                    console.error("Erreur insertMany :", err.message);
                    resolve();
                }
            })
            .on("error", reject);
    });

    writeLog("Import terminé");
    writeLog(`IMPORTED_COUNT=${importedCount}`);
    return importedCount;   // <-- IMPORTANT
}


//
// 🔥 CALCUL DIFF
//
async function calculerDiff() {
    writeLog("Calcul des diff…");

    // On ne garde que les lignes avec prix et date valides
    const rows = await Bitcoin.find({
        prix: { $ne: null },
        dateCours: { $ne: null }
    }).sort({ dateCours: 1 }).lean();

    writeLog(`→ ${rows.length} lignes chargées`);

    const updates = [];

    for (let i = 0; i < rows.length; i++) {
        const prixCourant = rows[i].prix;
        const dateCourante = rows[i].dateCours;

        let diffMax = 0;
        let dateDepassement = null;

        for (let j = i + 1; j < rows.length; j++) {
            if (rows[j].prix < prixCourant) {
                const jours = Math.floor(
                    (rows[j].dateCours - dateCourante) / (1000 * 60 * 60 * 24)
                );

                if (jours > diffMax) {
                    diffMax = jours;
                    dateDepassement = rows[j].dateCours; // date réelle du dépassement
                }
            }
        }

        updates.push({
            updateOne: {
                filter: { _id: rows[i]._id },
                update: {
                    $set: {
                        diff: diffMax,
                        dateDepassement: dateDepassement
                    }
                }
            }
        });
    }

    await Bitcoin.bulkWrite(updates, { ordered: false });

    writeLog("Calcul diff terminé !");
}

//
// 🔥 MAIN
//
async function runImportBitcoin() {
    writeLog("=== DEBUT IMPORT BITCOIN ===");
    writeLog("BITCOIN PATH: " + bitcoinPath);

    try {
        await connectDB();

        writeLog("=== Suppression ancienne data ===");
        await Bitcoin.deleteMany({});
        writeLog("→ Collection Bitcoin vidée");

        writeLog("=== Étape 1 : Import CSV ===");
        const importedCount = await runImport();   // <-- récupéré ici

        writeLog("=== Étape 2 : Calcul diff ===");
        await calculerDiff();

        writeLog("=== Terminé ===");

        return {
            success: true,
            importedCount
        };

    } catch (err) {
        console.error("Erreur:", err);
        return {
            success: false,
            error: err.message
        };
    } finally {
        // ❌ NE PAS fermer la connexion ici
        writeLog("=== FIN IMPORT BITCOIN ===");
    }
}

module.exports = runImportBitcoin;

