const Bitcoin = require("../models/bitcoin.model");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { execSync } = require("child_process");

exports.getMaxDiff = async (req, res) => {
    try {
        // 1️⃣ Récupérer la ligne avec le diff max
        const row = await Bitcoin.findOne()
            .sort({ diff: -1 })
            .lean();

        if (!row) {
            return res.json({
                diff: 0,
                dateCours: null,
                prixCours: null,
                dateDepassement: null,
                prixDepassement: null
            });
        }

        // 2️⃣ Récupérer le prix à dateCours
        const coursRow = await Bitcoin.findOne({ dateCours: row.dateCours }).lean();
        const prixCours = coursRow ? coursRow.prix : null;

        // 3️⃣ Récupérer le prix à dateDepassement
        let prixDepassement = null;
        if (row.dateDepassement) {
            const depRow = await Bitcoin.findOne({ dateCours: row.dateDepassement }).lean();
            prixDepassement = depRow ? depRow.prix : null;
        }

        // 4️⃣ Réponse complète
        res.json({
            diff: row.diff,
            dateCours: row.dateCours,
            prixCours,
            dateDepassement: row.dateDepassement,
            prixDepassement
        });

    } catch (err) {
        console.error("Erreur getMaxDiff:", err);
        res.status(500).json({ error: err.message });
    }
};


const runImportBitcoin = require("../uploads/import_bitcoin");

exports.runImportB = async (req, res) => {
    try {
        const result = await runImportBitcoin();
        res.json(result);
    } catch (err) {
        console.error("Erreur import:", err);
        res.status(500).json({ error: err.message });
    }
};

