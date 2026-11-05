require('dotenv').config({ path: '../config/.env' });
const connectDB = require("../config/db");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const writeLog = require("../utils/logger");
const Bitcoin = require("../models/bitcoin.model");

const bitcoinPath = path.join(__dirname, "../storage/historique/btc.csv");

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
                // event_date, close_price_usd, volume_usd

                if (!row.close_price_usd || row.close_price_usd.trim() === "") {
                    // Ligne sans prix → on l'ignore
                    return;
                }

                const [month, day, year] = row.event_date.replace(",", "").split(" ");

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

                const date = new Date(Date.UTC(
                    Number(year),
                    months[month],
                    Number(day)
                ));


                if (isNaN(date.getTime())) {
                    writeLog("DATE INVALIDE :", row.event_date);
                    return;
                }


                const prix = Number(
                    row.close_price_usd.replace(/,/g, "")
                );

                results.push({
                    dateCours: date,
                    prix,
                    volume: row.volume_usd ? Number(row.volume_usd) : null
                });
            })

            .on("end", async () => {
                try {
                    const uniqueDates = new Set(
                        results.map(r => r.dateCours.toISOString())
                    );

                    writeLog(`NB DATES UNIQUES=${uniqueDates.size}`);
                    writeLog(JSON.stringify(results[0]));
                    writeLog(JSON.stringify(results[1000]));
                    writeLog(JSON.stringify(results[2000]));
                    writeLog(JSON.stringify(results[3000]));
                    writeLog(JSON.stringify(results[4000]));
                    await Bitcoin.insertMany(results, { ordered: false });
                    const inserted = await Bitcoin.countDocuments({});

                    writeLog(`RESULTS_LENGTH=${results.length}`);
                    writeLog(`COUNT_APRES_INSERT=${inserted}`);

                    importedCount = results.length;
                    writeLog(`→ ${results.length} lignes insérées`);

                    resolve();
                } catch (err) {
                    writeLog("ERREUR COMPLETE :");
                    writeLog(err);

                    if (err.writeErrors) {
                        writeLog("writeErrors =", err.writeErrors.length);

                        err.writeErrors.slice(0, 10).forEach(e => {
                            writeLog(e.errmsg);
                        });
                    }

                    throw err;
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
