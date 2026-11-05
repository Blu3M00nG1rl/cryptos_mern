require('dotenv').config({ path: '../config/.env' });
const connectDB = require("../config/db");
const fs = require("fs");
const cheerio = require("cheerio");
const path = require("path");
const writeLog = require("../utils/logger");
const Bitcoin = require("../models/bitcoin.model");

const bitcoinPath = path.join(__dirname, "../storage/html/btc.html");

//
// 🔥 IMPORT HTML
//

async function runImport() {
    let importedCount = 0;

    const html = fs.readFileSync(bitcoinPath, "utf8");
    const $ = cheerio.load(html);

    const results = [];

    $("table tbody tr").each((index, row) => {

        const tds = $(row).find("td");

        if (tds.length < 7) {
            return;
        }

        const rawDate = $(tds[0]).text().trim();
        const rawPrice = $(tds[5]).text().trim();
        const rawVolume = $(tds[6]).text().trim();

        const [month, day, year] =
            rawDate.replace(",", "").split(" ");

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

        const dateCours = new Date(
            Date.UTC(
                Number(year),
                months[month],
                Number(day)
            )
        );

        if (isNaN(dateCours.getTime())) {
            writeLog(`Date invalide : ${rawDate}`);
            return;
        }

        const prix = Number(
            rawPrice.replace(/,/g, "")
        );

        const volume = Number(
            rawVolume.replace(/,/g, "")
        );

        results.push({
            dateCours,
            prix,
            volume
        });

    })

    writeLog(`RESULTS_LENGTH=${results.length}`);

    await Bitcoin.insertMany(
        results,
        { ordered: false }
    );

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

        writeLog("=== Étape 1 : Import Html ===");
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
