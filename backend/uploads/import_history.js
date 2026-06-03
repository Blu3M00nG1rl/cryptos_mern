require('dotenv').config({ path: '../config/.env' });

const connectDB = require("../config/db");
const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("csv-parser");
const History = require("../models/history.model");

const results = [];
let count = 0;

const runImport = async () => {
    await connectDB(); // ✅ attendre la connexion

    fs.createReadStream("../storage/historique_prix.csv")
        .pipe(csv())
        .on("data", (row) => {
            results.push({
                coinId: row.id,
                journee: row.Jnee === "NULL" ? null : new Date(row.Jnee),
                prix: row.Prix === "NULL" ? null : Number(row.Prix),
                market_cap: row.market_cap === "NULL" ? null : Number(row.market_cap),
                total_volume: row.total_volume === "NULL" ? null : Number(row.total_volume)                
            });
            count += results.length;
            console.log("Inséré : "+count)
        })
        .on("end", async () => {
            try {
                await History.insertMany(results, { ordered: false });
                console.log("Import terminé ✅");
            } catch (err) {
                console.error("Erreur import :", err);
            } finally {
                mongoose.connection.close();
            }
        });
};

runImport();

