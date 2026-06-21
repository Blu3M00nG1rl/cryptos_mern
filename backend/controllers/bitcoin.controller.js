const Bitcoin = require("../models/bitcoin.model");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { execSync } = require("child_process");

exports.getMaxDiff = async (req, res) => {
    try {
        const row = await Bitcoin.findOne()
            .sort({ diff: -1 }) // diff décroissant
            .lean();

        if (!row) {
            return res.json({ diff: 0, dateCours: null, dateDepassement: null });
        }

        res.json({
            diff: row.diff,
            dateCours: row.dateCours,
            dateDepassement: row.dateDepassement
        });

    } catch (err) {
        console.error("Erreur getMaxDiff:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.runImportB = async (req, res) => {
    try {
        const importPath = path.join(__dirname, "../uploads/import_bitcoin.js");

        if (!fs.existsSync(importPath)) {
            return res.status(400).json({ error: "Fichier import_bitcoin.js non trouvé" });
        }

        const stdout = execSync(`node ${importPath}`, { env: process.env }).toString();

        const match = stdout.match(/IMPORTED_COUNT=(\d+)/);
        const importedCount = match ? parseInt(match[1], 10) : 0;

        res.status(200).json({
            message: "Import terminé",
            importedCount,
            output: stdout
        });

    } catch (err) {
        console.error("Erreur import:", err);
        res.status(500).json({ error: err.message });
    }
};
