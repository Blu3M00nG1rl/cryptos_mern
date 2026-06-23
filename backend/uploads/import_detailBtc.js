require('dotenv').config({ path: '../config/.env' });
const axios = require('axios');

const connectDB = require("../config/db");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const AchatCoinEnBtc = require("../models/achatCoinEnBtc.model");

const detailPath = path.join(__dirname, "../storage/detailBtc.csv");

// Convertisseurs FR → JS
function parseFrenchNumber(str) {
    if (!str) return 0;
    return Number(str.replace(/\s/g, "").replace(",", "."));
}

function parseEuro(str) {
    if (!str) return 0;
    return Number(str.replace(/\s/g, "").replace("€", "").replace(",", "."));
}

function parseDateFR(str) {
    if (!str) return null;
    const [day, month, year] = str.split("/");
    const fullYear = Number(year) < 50 ? "20" + year : "19" + year;
    return new Date(`${fullYear}-${month}-${day}`);
}

function extractNumber(str) {
    if (!str) return 0;

    // Retire tout sauf chiffres, virgule, point et signe -
    const cleaned = str.replace(/[^0-9,.-]/g, "");

    // Convertit la virgule en point
    return parseFloat(cleaned.replace(",", "."));
}

async function runImport() {

    let importedCount = 0;

    if (!fs.existsSync(detailPath)) {
        console.log("Fichier detail.csv introuvable.");
        return;
    }

    console.log("Import du fichier :", detailPath);

    const rows = [];

    // 1️⃣ Lire toutes les lignes AVANT d'insérer
    await new Promise((resolve, reject) => {
        fs.createReadStream(detailPath)
            .pipe(csv())
            .on("data", (row) => rows.push(row))
            .on("end", resolve)
            .on("error", reject);
    });

    console.log(`Lignes trouvées : ${rows.length}`);

    // 2️⃣ Insérer proprement en séquentiel
    for (const row of rows) {
        try {
            const newAchatEnBtc = new AchatCoinEnBtc({
                symbol: row["Coin"],
                dateAchat: parseDateFR(row["Date Achat"]),
                stockage: row["Wallet/Exchange"],
                nombre: parseFrenchNumber(row["Montant"]),
                prixAchat: extractNumber(row["Prix d’Achat"]),
                observation: row["Observation"]
            });

            await newAchatEnBtc.save();
            importedCount++;

        } catch (err) {
            console.error("Erreur ligne CSV :", err.message, row);
        }
    }

    console.log("Import terminé");
    console.log(`IMPORTED_COUNT=${importedCount}`);
}


async function main() {
    console.log("=== DEBUT IMPORT DETAIL ===");
    try {
        await connectDB();
        await runImport();
        console.log("=== Terminé ===");
    } catch (err) {
        console.error("Erreur:", err);
    } finally {
        mongoose.connection.close();
    }
    console.log("=== FIN IMPORT DETAIL ===");
}

main();
