require('dotenv').config({ path: '../config/.env' });

const connectDB = require("../config/db");
const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("csv-parser");
const Coin = require("../models/coin.model");

const results = [];
let count = 0;

Coin.deleteMany({});

const runImport = async () => {
    await connectDB(); // ✅ attendre la connexion

    fs.createReadStream("../storage/coins_list.csv")
        .pipe(csv())
        .on("data", (row) => {
            results.push({
                no: row.no,
                coinId: row.id,
                symbol: row.symbol,
                name: row.name,
                dateAchat: row.date_achat === "NULL" ? null : new Date(row.date_achat),
                nombre: row.portefeuille === "NULL" ? null : Number(row.portefeuille),
                prix: row.montant === "NULL" ? null : Number(row.montant),
                stockage: row.wallet === "NULL" ? null : row.wallet,
                dateVerif: row.date_verification === "NULL" ? null : new Date(row.date_verification),
                observation: row.observation === "NULL" ? null : row.observation,
            });
            count += results.length;
            console.log("Inséré : "+count)
        })
        .on("end", async () => {
            try {
                await Coin.insertMany(results, { ordered: false });
                console.log("Import terminé ✅");
            } catch (err) {
                console.error("Erreur import :", err);
            } finally {
                mongoose.connection.close();
            }
        });
};

runImport();

