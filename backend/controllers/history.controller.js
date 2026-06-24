const History = require("../models/history.model");
const Coin = require("../models/coin.model");
const Bitcoin = require("../models/bitcoin.model");
const AchatCoin = require("../models/achatCoin.model");
const AchatCoinEnBtc = require("../models/achatCoinEnBtc.model");
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
    let { jneeCible } = req.body;

    try {
        jneeCible = new Date(jneeCible);
        jneeCible.setUTCHours(0, 0, 0, 0); // 🔥 important

        await History.deleteMany({ journee: { $lt: jneeCible } });

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

exports.getRecapData = async (req, res) => {
    try {
        const maxDiff = await getMaxDiffValue();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const cibleDate = new Date(today);
        cibleDate.setDate(cibleDate.getDate() - maxDiff);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const coins = await Coin.find().lean();

        // 🔥 Une seule aggregation pour tous les achats
        const achats = await AchatCoin.aggregate([
            {
                $group: {
                    _id: { $toLower: "$symbol" },
                    totalNombre: { $sum: "$nombre" },
                    totalInvesti: { $sum: { $multiply: ["$nombre", "$prixAchat"] } }
                }
            },
            {
                $addFields: {
                    prixAchatMoyen: {
                        $cond: [
                            { $eq: ["$totalNombre", 0] },
                            0,
                            { $divide: ["$totalInvesti", "$totalNombre"] }
                        ]
                    }
                }
            }
        ]);

        const mapAchats = new Map(
            achats.map(a => [
                a._id,
                {
                    totalNombre: a.totalNombre,
                    prixAchatMoyen: a.prixAchatMoyen
                }
            ])
        );

        const exportData = await Promise.all(
            coins.map(async (coin) => {
                const todayHistory = await History.findOne({
                    coinId: coin.coinId,
                    journee: { $gte: today, $lt: tomorrow }
                }).lean();

                const cibleHistory = await History.findOne({
                    coinId: coin.coinId,
                    journee: {
                        $gte: cibleDate,
                        $lt: new Date(cibleDate.getTime() + 86400000)
                    }
                }).lean();

                let evolution = null;
                if (todayHistory?.prix && cibleHistory?.prix) {
                    evolution = ((todayHistory.prix - cibleHistory.prix) / cibleHistory.prix) * 100;
                }

                // 🔥 Récupérer les infos d’achat pour ce symbole
                const key = coin.symbol.toLowerCase();
                const achat = mapAchats.get(key);

                return {
                    rank: coin.rank,
                    name: coin.name,
                    symbol: coin.symbol,
                    nombre: achat ? achat.totalNombre : 0,
                    prixCoin: achat ? achat.prixAchatMoyen : 0,
                    prixDuJour: todayHistory?.prix || null,
                    capitalisation: todayHistory?.market_cap || null,
                    volume24h: todayHistory?.total_volume || null,
                    prixCible: cibleHistory?.prix || null,
                    dateCible: cibleDate.toLocaleDateString("fr-FR"),
                    evolution
                };
            })
        );

        exportData.sort((a, b) => (b.capitalisation || 0) - (a.capitalisation || 0));

        res.status(200).json(exportData);

    } catch (err) {
        console.error("Erreur récupération données export:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.getVentesData = async (req, res) => {
    try {
        const maxDiff = await getMaxDiffValue();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const cibleDate = new Date(today);
        cibleDate.setDate(cibleDate.getDate() - maxDiff);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const coins = await Coin.find().lean();

        // Agrégation achats
        const achats = await AchatCoin.aggregate([
            {
                $group: {
                    _id: { $toLower: "$symbol" },
                    totalNombre: { $sum: "$nombre" },
                    totalInvesti: { $sum: { $multiply: ["$nombre", "$prixAchat"] } }
                }
            },
            {
                $addFields: {
                    prixAchatMoyen: {
                        $cond: [
                            { $eq: ["$totalNombre", 0] },
                            0,
                            { $divide: ["$totalInvesti", "$totalNombre"] }
                        ]
                    }
                }
            }
        ]);

        const mapAchats = new Map(
            achats.map(a => [
                a._id,
                {
                    totalNombre: a.totalNombre,
                    prixAchatMoyen: a.prixAchatMoyen
                }
            ])
        );

        // Agrégation achats
        const achatsEnBtc = await AchatCoinEnBtc.aggregate([
            {
                $group: {
                    _id: { $toLower: "$symbol" },
                    totalNombre: { $sum: "$nombre" },
                    totalInvesti: { $sum: { $multiply: ["$nombre", "$prixAchat"] } }
                }
            },
            {
                $addFields: {
                    prixAchatMoyen: {
                        $cond: [
                            { $eq: ["$totalNombre", 0] },
                            0,
                            { $divide: ["$totalInvesti", "$totalNombre"] }
                        ]
                    }
                }
            }
        ]);

        const mapAchatsEnBtc = new Map(
            achatsEnBtc.map(a => [
                a._id,
                {
                    totalNombre: a.totalNombre,
                    prixAchatMoyen: a.prixAchatMoyen
                }
            ])
        );

        const ventesDataRaw = await Promise.all(
            coins.map(async (coin) => {

                const todayHistory = await History.findOne({
                    coinId: coin.coinId,
                    journee: { $gte: today, $lt: tomorrow }
                }).lean();

                const yesterdayHistory = await History.findOne({
                    coinId: coin.coinId,
                    journee: { $gte: yesterday, $lt: today }
                }).lean();

                // --- PRIX BTC ---
                const btcToday = await History.findOne({
                    coinId: "bitcoin",
                    journee: { $gte: today, $lt: tomorrow }
                }).lean();

                const btcYesterday = await Bitcoin.findOne({
                    dateCours: { $gte: yesterday, $lt: today }
                }).lean();

                const btcCible = await Bitcoin.findOne({
                    dateCours: {
                        $gte: cibleDate,
                        $lt: new Date(cibleDate.getTime() + 86400000)
                    }
                }).lean();

                const prixAuj = todayHistory?.prix ?? null;
                const prixAujBtc = todayHistory?.prix / btcToday.prix ?? null;
                const prixHier = yesterdayHistory?.prix ?? null;
                const prixHierBtc = yesterdayHistory?.prix / btcYesterday.prix ?? null;
                const prixCibleBtc = btcCible?.prix / btcCible.prix ?? null;

                let evolution24 = null;
                if (prixAuj !== null && prixHier !== null) {
                    evolution24 = ((prixAuj - prixHier) / prixHier) * 100;
                }

                let evolution24Btc = null;
                if (prixAujBtc !== null && prixHierBtc !== null) {
                    evolution24Btc = ((prixAujBtc - prixHierBtc) / prixHierBtc) * 100;
                }

                const minHistory = await History.findOne({ coinId: coin.coinId })
                    .sort({ prix: 1 })
                    .lean();

                const maxHistory = await History.findOne({ coinId: coin.coinId })
                    .sort({ prix: -1 })
                    .lean();

                let fibVente = null;
                if (minHistory?.prix != null && maxHistory?.prix != null) {
                    const min = minHistory.prix;
                    const max = maxHistory.prix;
                    fibVente = (max - min) * 0.618 + min;
                    fibVenteBtc = fibVente / prixAujBtc;
                }

                const key = coin.symbol.toLowerCase();
                const achat = mapAchats.get(key);

                const cibleHistory = await History.findOne({
                    coinId: coin.coinId,
                    journee: {
                        $gte: cibleDate,
                        $lt: new Date(cibleDate.getTime() + 86400000)
                    }
                }).lean();

                // Evolution USD
                let evolutionCible = null;
                if (todayHistory?.prix != null && cibleHistory?.prix != null) {
                    evolutionCible = ((todayHistory.prix - cibleHistory.prix) / cibleHistory.prix) * 100;
                }

                // Evolution BTC
                let evolutionCibleBtc = null;
                if (prixAujBtc != null && prixCibleBtc != null) {
                    evolutionCibleBtc = ((prixAujBtc - prixCibleBtc) / prixCibleBtc) * 100;
                }

                return {
                    symbol: coin.symbol,
                    name: coin.name,
                    nombre: achat ? achat.totalNombre : 0,
                    prixCoin: achat ? achat.prixAchatMoyen : 0,
                    nombreEnBtc: achatsEnBtc ? achatsEnBtc.totalNombre : 0,
                    prixCoinEnBtc: achatsEnBtc ? achatsEnBtc.prixAchatMoyen : 0,
                    prixAuj,
                    prixAujBtc,
                    prixHier,
                    prixHierBtc,
                    evolution24,
                    evolution24Btc,
                    evolutionCible,
                    evolutionCibleBtc,
                    fibVente,
                    fibVenteBtc,
                    market_cap: todayHistory?.market_cap ?? null,
                    volume: todayHistory?.total_volume ?? null
                };
            })
        );

        // 🔥 Filtre final corrigé
        const ventesData = ventesDataRaw.filter(
            item =>
                item.evolution24 !== null &&
                item.evolution24 < 0 &&
                item.prixAuj !== null &&
                item.fibVente !== null &&
                item.prixAuj > item.fibVente &&
                item.nombre > 0
        );

        // 🔥 Filtre final corrigé
        const ventesDataBtc = ventesDataRaw.filter(
            item =>
                item.evolution24Btc !== null &&
                item.evolution24Btc < 0 &&
                item.prixAujBtc !== null &&
                item.fibVenteBtc !== null &&
                item.prixAujBtc > item.fibVenteBtc &&
                item.nombre > 0
        );

        res.status(200).json({
            ventesData,
            ventesDataBtc
        });

    } catch (err) {
        console.error("Erreur getVentesData:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.getAchatsData = async (req, res) => {
    try {
        const maxDiff = await getMaxDiffValue();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const cibleDate = new Date(today);
        cibleDate.setDate(cibleDate.getDate() - maxDiff);

        const coins = await Coin.find().lean();

        const tetherHistory = await History.findOne({
            coinId: "tether",
            journee: { $gte: today, $lt: tomorrow }
        }).lean();

        const prixTetherAuj = tetherHistory?.prix ?? null;

        let evolutionBitcoin = null;

        const btcToday = await History.findOne({
            coinId: "bitcoin",
            journee: { $gte: today, $lt: tomorrow }
        }).lean();

        const btcYesterday = await History.findOne({
            coinId: "bitcoin",
            journee: { $gte: yesterday, $lt: today }
        }).lean();

        const btcCible = await History.findOne({
            coinId: "bitcoin",
            journee: {
                $gte: cibleDate,
                $lt: new Date(cibleDate.getTime() + 86400000)
            }
        }).lean();

        evolutionBitcoin = ((btcToday.prix - btcCible.prix) / btcCible.prix) * 100;

        // 🔥 Total USDC + USDT dans AchatCoin
        const stableAgg = await AchatCoin.aggregate([
            {
                $match: {
                    symbol: { $in: ["USDC", "USDT"] }
                }
            },
            {
                $group: {
                    _id: { $toLower: "$symbol" },
                    totalNombre: { $sum: "$nombre" }
                }
            }
        ]);

        const mapStable = new Map(
            stableAgg.map(s => [s._id, s.totalNombre])
        );

        const totalUSDC = mapStable.get("usdc") || 0;
        const totalUSDT = mapStable.get("usdt") || 0;

        // 🔥 Prix du jour USDC / USDT
        const usdcHistory = await History.findOne({
            coinId: "usd-coin",
            journee: { $gte: today, $lt: tomorrow }
        }).lean();

        const usdtHistory = await History.findOne({
            coinId: "tether",
            journee: { $gte: today, $lt: tomorrow }
        }).lean();

        const prixUSDC = usdcHistory?.prix || 0;
        const prixUSDT = usdtHistory?.prix || 0;
        const prixStable = (prixUSDC + prixUSDT) / 2;

        // 🔥 Valeur totale stable
        const stableUSDC = totalUSDC * prixUSDC;
        const stableUSDT = totalUSDT * prixUSDT;
        const stables = stableUSDC + stableUSDT;

        // 🔥 Agrégation achatcoins : totalNombre + prix moyen
        const achats = await AchatCoin.aggregate([
            {
                $group: {
                    _id: { $toLower: "$symbol" },
                    totalNombre: { $sum: "$nombre" },
                    totalInvesti: { $sum: { $multiply: ["$nombre", "$prixAchat"] } }
                }
            },
            {
                $addFields: {
                    prixAchatMoyen: {
                        $cond: [
                            { $eq: ["$totalNombre", 0] },
                            0,
                            { $divide: ["$totalInvesti", "$totalNombre"] }
                        ]
                    }
                }
            }
        ]);

        const mapAchats = new Map(
            achats.map(a => [
                a._id,
                {
                    totalNombre: a.totalNombre,
                    prixAchatMoyen: a.prixAchatMoyen
                }
            ])
        );

        const btcNombre = mapAchats.get("btc")?.totalNombre || 0;

        const achatsDataRaw = await Promise.all(
            coins.map(async (coin) => {
                const key = coin.symbol.toLowerCase();
                const achat = mapAchats.get(key);

                const todayHistory = await History.findOne({
                    coinId: coin.coinId,
                    journee: { $gte: today, $lt: tomorrow }
                }).lean();

                const yesterdayHistory = await History.findOne({
                    coinId: coin.coinId,
                    journee: { $gte: yesterday, $lt: today }
                }).lean();

                const cibleHistory = await History.findOne({
                    coinId: coin.coinId,
                    journee: {
                        $gte: cibleDate,
                        $lt: new Date(cibleDate.getTime() + 86400000)
                    }
                }).lean();

                const prixAuj = todayHistory?.prix ?? null;
                const prixHier = yesterdayHistory?.prix ?? null;
                const prixCible = cibleHistory?.prix ?? null;

                let evolution = null;
                if (prixAuj !== null && prixCible !== null) {
                    evolution = ((prixAuj - prixCible) / prixCible) * 100;
                }

                let evolution24h = null;
                if (prixAuj !== null && prixHier !== null) {
                    evolution24h = ((prixAuj - prixHier) / prixHier) * 100;
                }

                const minHistory = await History.findOne({ coinId: coin.coinId })
                    .sort({ prix: 1 })
                    .lean();

                const maxHistory = await History.findOne({ coinId: coin.coinId })
                    .sort({ prix: -1 })
                    .lean();

                let fibAchat = null;
                if (minHistory?.prix != null && maxHistory?.prix != null) {
                    const min = minHistory.prix;
                    const max = maxHistory.prix;
                    fibAchat = (max - min) * 0.382 + min;
                }

                return {
                    symbol: coin.symbol,
                    name: coin.name,
                    prixAuj,
                    prixHier,
                    evolution,
                    evolution24h,
                    fibAchat,
                    market_cap: todayHistory?.market_cap ?? null,
                    total_volume: todayHistory?.total_volume ?? null,
                    nombre: achat ? achat.totalNombre : 0,
                    prixCoin: achat ? achat.prixAchatMoyen : 0,
                };
            })
        );

        const achatsDataRawEnBtc = await Promise.all(
            coins.map(async (coin) => {
                const key = coin.symbol.toLowerCase();
                const achat = mapAchats.get(key);

                const todayHistory = await History.findOne({
                    coinId: coin.coinId,
                    journee: { $gte: today, $lt: tomorrow }
                }).lean();

                const yesterdayHistory = await History.findOne({
                    coinId: coin.coinId,
                    journee: { $gte: yesterday, $lt: today }
                }).lean();

                const cibleHistory = await History.findOne({
                    coinId: coin.coinId,
                    journee: {
                        $gte: cibleDate,
                        $lt: new Date(cibleDate.getTime() + 86400000)
                    }
                }).lean();

                const prixAujBtc = todayHistory?.prix / btcToday.prix ?? null;
                const prixHierBtc = yesterdayHistory?.prix / btcYesterday.prix ?? null;
                const prixCibleBtc = cibleHistory?.prix / btcCible.prix ?? null;

                let evolutionBtc = null;
                if (prixAujBtc !== null && prixCibleBtc !== null) {
                    evolutionBtc = ((prixAujBtc - prixCibleBtc) / prixCibleBtc) * 100;
                }

                let evolution24hBtc = null;
                if (prixAujBtc !== null && prixHierBtc !== null) {
                    evolution24hBtc = ((prixAujBtc - prixHierBtc) / prixHierBtc) * 100;
                }

                const minHistory = await History.findOne({ coinId: coin.coinId })
                    .sort({ prix: 1 })
                    .lean();

                const maxHistory = await History.findOne({ coinId: coin.coinId })
                    .sort({ prix: -1 })
                    .lean();

                let fibAchat = null;
                let fibAchatBtc = null;
                if (minHistory?.prix != null && maxHistory?.prix != null) {
                    const min = minHistory.prix;
                    const max = maxHistory.prix;
                    fibAchat = (max - min) * 0.382 + min;
                    fibAchatBtc = fibAchat / prixAujBtc;
                }

                return {
                    symbol: coin.symbol,
                    name: coin.name,
                    prixAujBtc,
                    prixHierBtc,
                    prixCibleBtc,
                    evolutionBtc,
                    evolution24hBtc,
                    fibAchatBtc,
                    btcToday,
                    btcYesterday,
                    btcCible,
                    market_cap: todayHistory?.market_cap ?? null,
                    total_volume: todayHistory?.total_volume ?? null,
                    nombre: achat ? achat.totalNombre : 0,
                    prixCoin: achat ? achat.prixAchatMoyen : 0,
                };
            })
        );

        // 🔥 Filtre 
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

        // 🔥 Filtre Btc
        const achatsDataBtc = achatsDataRawEnBtc.filter(item =>
            item.evolutionBtc !== null &&
            item.evolutionBtc > 0 &&
            item.evolution24hBtc !== null &&
            item.evolution24hBtc > 0 &&
            item.prixAujBtc !== null &&
            item.fibAchatBtc !== null &&
            item.prixAujBtc < item.fibAchatBtc &&
            prixTetherAuj !== null &&
            item.evolutionBtc > (prixTetherAuj * 0.10)
        );

        res.status(200).json({
            achatsData,
            achatsDataBtc,
            stables: stables,
            prixStable: prixStable,
            btcNombre: btcNombre,
            btcEvolution: evolutionBitcoin,
            btcPrice: btcToday.prix
        });


    } catch (err) {
        console.error("Erreur:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.getSyntheseData = async (req, res) => {
    try {
        const maxDiff = await getMaxDiffValue();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const cibleDate = new Date(today);
        cibleDate.setDate(cibleDate.getDate() - maxDiff);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const coins = await Coin.find().lean();

        const syntheseData = await Promise.all(
            coins.map(async (coin) => {

                // --- PRIX USD ---
                const todayHistory = await History.findOne({
                    coinId: coin.coinId,
                    journee: { $gte: today, $lt: tomorrow }
                }).lean();

                const yesterdayHistory = await History.findOne({
                    coinId: coin.coinId,
                    journee: { $gte: yesterday, $lt: today }
                }).lean();

                const cibleHistory = await History.findOne({
                    coinId: coin.coinId,
                    journee: {
                        $gte: cibleDate,
                        $lt: new Date(cibleDate.getTime() + 86400000)
                    }
                }).lean();

                const minHistory = await History.findOne({ coinId: coin.coinId })
                    .sort({ prix: 1 })
                    .lean();

                const maxHistory = await History.findOne({ coinId: coin.coinId })
                    .sort({ prix: -1 })
                    .lean();

                // --- PRIX BTC ---
                const btcToday = await History.findOne({
                    coinId: "bitcoin",
                    journee: { $gte: today, $lt: tomorrow }
                }).lean();

                const btcYesterday = await History.findOne({
                    coinId: "bitcoin",
                    journee: { $gte: yesterday, $lt: today }
                }).lean();

                const btcCible = await History.findOne({
                    coinId: "bitcoin",
                    journee: {
                        $gte: cibleDate,
                        $lt: new Date(cibleDate.getTime() + 86400000)
                    }
                }).lean();

                // --- Prix BTC au moment du max USD ---
                let btcAtMax = null;
                if (maxHistory?.journee) {
                    btcAtMax = await Bitcoin.findOne({
                        dateCours: {
                            $gte: maxHistory.journee,
                            $lt: new Date(maxHistory.journee.getTime() + 86400000)
                        }
                    }).lean();
                }

                // --- Prix BTC au moment du min USD ---
                let btcAtMin = null;
                if (minHistory?.journee) {
                    btcAtMin = await Bitcoin.findOne({
                        dateCours: {
                            $gte: minHistory.journee,
                            $lt: new Date(minHistory.journee.getTime() + 86400000)
                        }
                    }).lean();
                }

                const prixAujBtc = todayHistory?.prix / btcToday.prix ?? null;
                const prixHierBtc = yesterdayHistory?.prix / btcYesterday.prix ?? null;
                const prixCibleBtc = cibleHistory?.prix / btcCible.prix ?? null;

                // --- EVOLUTION ---
                let evolution = null;
                if (todayHistory?.prix && cibleHistory?.prix) {
                    evolution = ((todayHistory.prix - cibleHistory.prix) / cibleHistory.prix) * 100;
                }

                let evolutionBtc = null;
                if (prixAujBtc !== null && prixCibleBtc !== null) {
                    evolutionBtc = ((prixAujBtc - prixCibleBtc) / prixCibleBtc) * 100;
                }

                // Fibonnaci
                let fibVente = null;
                let fibAchat = null;

                if (minHistory?.prix && maxHistory?.prix) {
                    const min = minHistory.prix;
                    const max = maxHistory.prix;

                    fibVente = (max - min) * 0.618 + min;
                    fibAchat = (max - min) * 0.382 + min;
                }

                return {
                    symbol: coin.symbol,
                    name: coin.name,

                    // USD
                    prixAuj: todayHistory?.prix || null,
                    prixHier: yesterdayHistory?.prix || null,
                    prixCible: cibleHistory?.prix || null,
                    btcToday: btcToday.prix,
                    btcYesterday: btcYesterday.prix,
                    btcCible: btcCible.prix,

                    // Min / Max USD
                    max: maxHistory ? { prix: maxHistory.prix, date: maxHistory.journee } : null,
                    min: minHistory ? { prix: minHistory.prix, date: minHistory.journee } : null,

                    // Min / Max BTC (prix BTC à la date du max/min USD)
                    maxBTC: btcAtMax ? { prix: btcAtMax.prix } : null,
                    minBTC: btcAtMin ? { prix: btcAtMin.prix } : null,

                    evolution,
                    evolutionBtc,
                    fibAchat,
                    fibVente
                };

            })
        );

        res.status(200).json({
            dateCible: cibleDate,
            data: syntheseData
        });

    } catch (err) {
        console.error("Erreur getSyntheseData:", err);
        res.status(500).json({ error: err.message });
    }
};




