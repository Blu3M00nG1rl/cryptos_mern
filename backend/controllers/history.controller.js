const History = require("../models/history.model");
const Coin = require("../models/coin.model");
const Bitcoin = require("../models/bitcoin.model");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const mongoose = require("mongoose");

async function getMaxDiffValue() {
    const row = await Bitcoin.findOne().sort({ diff: -1 }).lean();
    return row ? row.diff : 0;
}

exports.updateHistory = async (req, res) => {
    const { coinId, journee, prix, market_cap, total_volume } = req.body;

    if (!coinId || !journee) {
        return res.status(400).json({ error: "Les champs coinId et journee sont obligatoires." });
    }

    try {
        const history = await History.findOneAndUpdate(
            { coinId, journee }, // Critère de recherche
            { prix, market_cap, total_volume }, // Données à mettre à jour
            { new: true, upsert: true } // Options : retourne le doc mis à jour, et crée si absent
        );
        console.log(coinId + " mis à jour");
        res.status(201).json({ history });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

exports.deleteHistory = async (req, res) => {
    let { jneeProjection } = req.body;

    try {
        jneeProjection = new Date(jneeProjection);
        jneeProjection.setUTCHours(0, 0, 0, 0); // 🔥 important

        await History.deleteMany({ journee: { $lt: jneeProjection } });

        res.status(201).json({ message: "Suppression réussie" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getStats = async (req, res) => {
    try {
        const lastUpdate = await History.findOne({}, {}, { sort: { journee: -1 } });
        const coinsCount = await Coin.countDocuments();

        res.status(200).json({
            lastUpdate: lastUpdate?.journee || null,
            coinsCount: coinsCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.runImportJ = async (req, res) => {
    try {
        const importPath = path.join(__dirname, "../uploads/import.js");

        if (!fs.existsSync(importPath)) {
            return res.status(400).json({ error: "Fichier import.js non trouvé" });
        }

        exec(`node ${importPath}`, { env: process.env }, (error, stdout, stderr) => {
            if (error) {
                console.error("Erreur import:", error);
                return res.status(500).json({ error: error.message });
            }

            // Extraction du compteur
            const match = stdout.match(/IMPORTED_COUNT=(\d+)/);
            const importedCount = match ? parseInt(match[1], 10) : 0;

            res.status(200).json({
                message: "Import terminé",
                importedCount,
                output: stdout
            });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.runImportH = async (req, res) => {
    try {
        const importPath = path.join(__dirname, "../uploads/import_history.js");

        if (!fs.existsSync(importPath)) {
            return res.status(400).json({ error: "Fichier import_history.js non trouvé" });
        }

        exec(`node ${importPath}`, { env: process.env }, (error, stdout, stderr) => {
            if (error) {
                console.error("Erreur import:", error);
                return res.status(500).json({ error: error.message });
            }

            // Extraction du compteur
            const match = stdout.match(/IMPORTED_COUNT=(\d+)/);
            const importedCount = match ? parseInt(match[1], 10) : 0;

            res.status(200).json({
                message: "Import terminé",
                importedCount,
                output: stdout
            });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getExportData = async (req, res) => {
    try {
        // 🔥 Lire maxDiff directement dans MongoDB
        const maxDiff = await getMaxDiffValue();
        console.log("maxDiff =", maxDiff);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 🔥 Date de projection = today - maxDiff jours
        const projectionDate = new Date(today);
        projectionDate.setDate(projectionDate.getDate() - maxDiff);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const coins = await Coin.find().lean();

        const exportData = await Promise.all(
            coins.map(async (coin) => {
                const todayHistory = await History.findOne({
                    coinId: coin.coinId,
                    journee: { $gte: today, $lt: tomorrow }
                }).lean();

                const projectionHistory = await History.findOne({
                    coinId: coin.coinId,
                    journee: {
                        $gte: projectionDate,
                        $lt: new Date(projectionDate.getTime() + 86400000)
                    }
                }).lean();

                return {
                    rank: coin.rank,
                    name: coin.name,
                    symbol: coin.symbol,
                    nombre: coin.nombre || 0,
                    prixDuJour: todayHistory?.prix || null,
                    capitalisation: todayHistory?.market_cap || null,
                    volume24h: todayHistory?.total_volume || null,
                    prixProjection: projectionHistory?.prix || null,
                    dateProjection: projectionDate.toLocaleDateString("fr-FR")
                };
            })
        );

        // 🔥 Tri par market cap décroissant
        exportData.sort((a, b) => (b.capitalisation || 0) - (a.capitalisation || 0));

        res.status(200).json(exportData);

    } catch (err) {
        console.error("Erreur récupération données export:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.getVentesData = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const coins = await Coin.find({ nombre: { $gt: 0 } }).lean();

        // Étape 1 : calcul brut
        const ventesDataRaw = await Promise.all(
            coins.map(async (coin) => {

                // Prix aujourd’hui
                const todayHistory = await History.findOne({
                    coinId: coin.coinId,
                    journee: { $gte: today, $lt: tomorrow }
                }).lean();

                // Prix hier
                const yesterdayHistory = await History.findOne({
                    coinId: coin.coinId,
                    journee: { $gte: yesterday, $lt: today }
                }).lean();

                // Prix min (plus ancien)
                const oldestHistory = await History.findOne({
                    coinId: coin.coinId
                }).sort({ journee: 1 }).lean();

                // Prix max (plus récent)
                const newestHistory = await History.findOne({
                    coinId: coin.coinId
                }).sort({ journee: -1 }).lean();

                const prixAuj = todayHistory?.prix || null;
                const prixHier = yesterdayHistory?.prix || null;

                // Calcul évolution
                let evolution = null;
                if (prixAuj && prixHier) {
                    evolution = ((prixAuj - prixHier) / prixHier) * 100;
                }

                // Min & Max
                const minHistory = await History.findOne({ coinId: coin.coinId })
                    .sort({ prix: 1 })
                    .lean();

                const maxHistory = await History.findOne({ coinId: coin.coinId })
                    .sort({ prix: -1 })
                    .lean();

                // Fibonnaci
                let fibVente = null;

                if (minHistory?.prix && maxHistory?.prix) {
                    const min = minHistory.prix;
                    const max = maxHistory.prix;

                    fibVente = (max - min) * 0.618 + min;
                }

                return {
                    symbol: coin.symbol,
                    name: coin.name,
                    nombre: coin.nombre,
                    prixAuj,
                    prixHier,
                    evolution,
                    fibVente,
                    market_cap: todayHistory?.market_cap || null,
                    volume: todayHistory?.total_volume || null
                };
            })
        );

        // Étape 2 : filtre final
        const ventesData = ventesDataRaw.filter(
            item =>
                item.evolution !== null &&
                item.evolution < 0 &&
                item.prixAuj !== null &&
                item.fibV !== null &&
                item.prixAuj > item.fibVente
        );

        res.status(200).json(ventesData);

    } catch (err) {
        console.error("Erreur getVentesData:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.getAchatsData = async (req, res) => {
    try {
        // 🔥 Récupérer maxDiff depuis Bitcoin
        const maxDiff = await getMaxDiffValue();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 🔥 Date de projection = today - maxDiff jours
        const projectionDate = new Date(today);
        projectionDate.setDate(projectionDate.getDate() - maxDiff);

        const coins = await Coin.find({ nombre: { $gt: 0 } }).lean();

        // Prix du tether aujourd’hui
        const tetherHistory = await History.findOne({
            coinId: "tether",
            journee: { $gte: today, $lt: tomorrow }
        }).lean();

        const prixTetherAuj = tetherHistory?.prix || null;

        // 🔥 Évolution Bitcoin 24h
        let evolutionBitcoin = null;

        const btcToday = await History.findOne({
            coinId: "bitcoin",
            journee: { $gte: today, $lt: tomorrow }
        }).lean();

        const btcYesterday = await History.findOne({
            coinId: "bitcoin",
            journee: { $gte: yesterday, $lt: today }
        }).lean();

        if (btcToday?.prix && btcYesterday?.prix) {
            evolutionBitcoin = ((btcToday.prix - btcYesterday.prix) / btcYesterday.prix) * 100;
        }

        // Étape 1 : calcul brut
        const achatsDataRaw = await Promise.all(
            coins.map(async (coin) => {

                const todayHistory = await History.findOne({
                    coinId: coin.coinId,
                    journee: { $gte: today, $lt: tomorrow }
                }).lean();

                const yesterdayHistory = await History.findOne({
                    coinId: coin.coinId,
                    journee: { $gte: yesterday, $lt: today }
                }).lean();

                const projectionHistory = await History.findOne({
                    coinId: coin.coinId,
                    journee: {
                        $gte: projectionDate,
                        $lt: new Date(projectionDate.getTime() + 86400000)
                    }
                }).lean();

                const prixAuj = todayHistory?.prix || null;
                const prixHier = yesterdayHistory?.prix || null;
                const prixProjection = projectionHistory?.prix || null;

                let evolution = null;
                if (prixAuj && prixProjection) {
                    evolution = ((prixAuj - prixProjection) / prixProjection) * 100;
                }

                let evolution24h = null;
                if (prixAuj && prixHier) {
                    evolution24h = ((prixAuj - prixHier) / prixHier) * 100;
                }

                const minHistory = await History.findOne({ coinId: coin.coinId })
                    .sort({ prix: 1 })
                    .lean();

                const maxHistory = await History.findOne({ coinId: coin.coinId })
                    .sort({ prix: -1 })
                    .lean();

                let fibAchat = null;
                if (minHistory?.prix && maxHistory?.prix) {
                    const min = minHistory.prix;
                    const max = maxHistory.prix;
                    fibAchat = (max - min) * 0.382 + min;
                }

                return {
                    symbol: coin.symbol,
                    name: coin.name,
                    nombre: coin.nombre,
                    prixAuj,
                    prixHier,
                    evolution,
                    evolution24h,
                    fibAchat,
                    market_cap: todayHistory?.market_cap || null,
                    total_volume: todayHistory?.total_volume || null
                };
            })
        );

        // Étape 2 : filtre final
        const achatsData = achatsDataRaw.filter(item =>
            item.evolution !== null &&
            item.evolution > 0 &&
            item.evolution24h !== null &&
            item.evolution24h > 0 &&
            item.prixAuj !== null &&
            item.fibAchat !== null &&
            item.prixAuj < item.fibAchat &&

            prixTetherAuj !== null &&
            item.evolution > (prixTetherAuj * 0.10) &&

            evolutionBitcoin !== null &&
            item.evolution > evolutionBitcoin
        );

        res.status(200).json(achatsData);

    } catch (err) {
        console.error("Erreur getAchatsData:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.getSyntheseData = async (req, res) => {
    try {
        // 🔥 Récupérer maxDiff depuis Bitcoin
        const maxDiff = await getMaxDiffValue();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const projectionDate = new Date(today);
        projectionDate.setDate(projectionDate.getDate() - maxDiff);
        console.log(projectionDate);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const coins = await Coin.find().lean();

        const syntheseData = await Promise.all(
            coins.map(async (coin) => {

                // Prix aujourd’hui
                const todayHistory = await History.findOne({
                    coinId: coin.coinId,
                    journee: { $gte: today, $lt: tomorrow }
                }).lean();

                // Prix hier
                const yesterdayHistory = await History.findOne({
                    coinId: coin.coinId,
                    journee: { $gte: yesterday, $lt: today }
                }).lean();

                // Prix projection
                const projectionHistory = await History.findOne({
                    coinId: coin.coinId,
                    journee: {
                        $gte: projectionDate,
                        $lt: new Date(projectionDate.getTime() + 86400000)
                    }
                }).lean();

                // Min & Max
                const minHistory = await History.findOne({ coinId: coin.coinId })
                    .sort({ prix: 1 })
                    .lean();

                const maxHistory = await History.findOne({ coinId: coin.coinId })
                    .sort({ prix: -1 })
                    .lean();

                // Fibonnaci
                let fibVente = null;
                let fibAchat = null;

                if (minHistory?.prix && maxHistory?.prix) {
                    const min = minHistory.prix;
                    const max = maxHistory.prix;

                    fibVente = (max - min) * 0.618 + min;
                    fibAchat = (max - min) * 0.382 + min;
                }

                // Evolution %
                let evolution = null;
                if (todayHistory?.prix && projectionHistory?.prix) {
                    evolution = ((todayHistory.prix - projectionHistory.prix) / projectionHistory.prix) * 100;
                }

                return {
                    symbol: coin.symbol,
                    name: coin.name,
                    prixAuj: todayHistory?.prix || null,
                    prixHier: yesterdayHistory?.prix || null,
                    prixProjection: projectionHistory?.prix || null,
                    evolution,
                    max: maxHistory ? { prix: maxHistory.prix, date: maxHistory.journee } : null,
                    min: minHistory ? { prix: minHistory.prix, date: minHistory.journee } : null,
                    fibVente,
                    fibAchat
                };
            })
        );

        res.status(200).json({
            dateProjection: projectionDate,
            data: syntheseData
        });


    } catch (err) {
        console.error("Erreur getSyntheseData:", err);
        res.status(500).json({ error: err.message });
    }
};




