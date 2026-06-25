require('dotenv').config({ path: '../config/.env' });
const axios = require('axios');

const connectDB = require("../config/db");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const Bitcoin = require("../models/bitcoin.model");

const bitcoinPath = path.join(__dirname, "../storage/historique/btc-usd-max.csv");

async function runImport() {
    if (!fs.existsSync(bitcoinPath)) {
        console.log("Fichier CSV introuvable.");
        return;
    }

    let importedCount = 0;
    const results = [];

    await new Promise((resolve, reject) => {
        fs.createReadStream(bitcoinPath)
            .pipe(csv())
            .on("data", (row) => {
                results.push({
                    dateCours: row.snapped_at ? new Date(row.snapped_at) : null,
                    prix: row.price ? Number(row.price) : null
                });
            })
            .on("end", async () => {
                try {
                    const bulkOps = results.map(r => ({
                        updateOne: {
                            filter: { dateCours: r.dateCours },
                            update: { $set: r },
                            upsert: true
                        }
                    }));

                    await Bitcoin.bulkWrite(bulkOps, { ordered: false });

                    importedCount = results.length;

                    console.log(`→ ${results.length} lignes importées/mises à jour`);
                    resolve();
                } catch (err) {
                    console.error("Erreur bulkWrite :", err.message);
                    resolve();
                }
            })
            .on("error", reject);
    });

    console.log("Import terminé");
    console.log(`IMPORTED_COUNT=${importedCount}`);
}


async function calculerDiff() {
    console.log("Calcul des diff…");

    const rows = await Bitcoin.find().sort({ dateCours: 1 }).lean();

    console.log(`→ ${rows.length} lignes chargées`);

    const updates = [];

    for (let i = 0; i < rows.length; i++) {
        const prixCourant = rows[i].prix;
        const dateCourante = rows[i].dateCours;

        let diffMax = 0;

        for (let j = i + 1; j < rows.length; j++) {
            if (rows[j].prix < prixCourant) {
                const jours = Math.floor(
                    (rows[j].dateCours - dateCourante) / (1000 * 60 * 60 * 24)
                );
                if (jours > diffMax) diffMax = jours;
            }
        }

        const dateDepassement =
            diffMax > 0
                ? new Date(dateCourante.getTime() + diffMax * 86400000)
                : null;

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

    console.log("Calcul diff terminé !");
}

//
// 🔥 Fonction principale : exécute les deux étapes dans l’ordre
//
async function main() {
    console.log("=== DEBUT IMPORT BITCOIN ===");
    try {
        await connectDB();
        console.log("=== Étape 1 : Import CSV ===");
        await runImport();

        console.log("=== Étape 2 : Calcul diff ===");
        await calculerDiff();

        console.log("=== Terminé ===");
    } catch (err) {
        console.error("Erreur:", err);
    } finally {
        mongoose.connection.close();
    }
    console.log("=== FIN IMPORT BITCOIN ===");
}

main();
