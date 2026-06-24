const Coin = require("../models/coin.model");
const AchatCoin = require("../models/achatCoin.model");
const AchatCoinEnBtc = require("../models/achatCoinEnBtc.model");
const History = require("../models/history.model");
const Bitcoin = require("../models/bitcoin.model");
const Note = require("../models/note.model");

async function getMaxDiffValue() {
    const row = await Bitcoin.findOne().sort({ diff: -1 }).lean();
    return row ? row.diff : 0;
}

// CREATE
exports.createCoin = async (req, res) => {
    try {
        const { no, coinId, symbol, name, rank } = req.body;

        if (!no || !coinId || !symbol || !name || !rank) {
            return res.status(400).json({ error: "Champs manquants" });
        }

        const coin = await Coin.create({ no, coinId, symbol, name, rank });

        res.status(201).json(coin);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// READ ALL
exports.getAllCoins = async (req, res) => {
    try {
        const coins = await Coin.find().sort({ no: 1 }).lean();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const maxDiff = await getMaxDiffValue();

        const cibleDate = new Date(today);
        cibleDate.setDate(cibleDate.getDate() - maxDiff);

        const coinIds = coins.map(c => c.coinId);

        // Prix du jour
        const histories = await History.find({
            coinId: { $in: coinIds },
            journee: { $gte: today, $lt: tomorrow }
        })
            .select("coinId prix")
            .lean();

        const mapHistory = new Map(histories.map(h => [h.coinId, h.prix]));

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

        // 🔥 Construire le résultat avec Promise.all
        const result = await Promise.all(
            coins.map(async (c) => {
                const key = c.symbol.toLowerCase();
                const achat = mapAchats.get(key);
                const todayHistory = await History.findOne({
                    coinId: c.coinId,
                    journee: { $gte: today, $lt: tomorrow }
                }).lean();

                const cibleHistory = await History.findOne({
                    coinId: c.coinId,
                    journee: {
                        $gte: cibleDate,
                        $lt: new Date(cibleDate.getTime() + 86400000)
                    }
                }).lean();

                let evolution = null;
                if (todayHistory?.prix && cibleHistory?.prix) {
                    evolution = ((todayHistory.prix - cibleHistory.prix) / cibleHistory.prix) * 100;
                }
                return {
                    ...c,
                    nombre: achat ? achat.totalNombre : 0,
                    prixCoin: achat ? achat.prixAchatMoyen : 0,
                    prixHistory: mapHistory.get(c.coinId) || null,
                    dateCible: cibleDate.toLocaleDateString("fr-FR"),
                    evolution,
                    capitalisation: todayHistory?.market_cap || null,
                };
            })
        );

        res.status(200).json(result);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// READ ALL
exports.getAllCoinsEnBtc = async (req, res) => {
    try {
        const coins = await Coin.find().sort({ no: 1 }).lean();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const maxDiff = await getMaxDiffValue();

        const cibleDate = new Date(today);
        cibleDate.setDate(cibleDate.getDate() - maxDiff);

        const coinIds = coins.map(c => c.coinId);

        const btcToday = await History.findOne({
            coinId: "bitcoin",
            journee: { $gte: today, $lt: tomorrow }
        }).lean();

        // Prix du jour
        const histories = await History.find({
            coinId: { $in: coinIds },
            journee: { $gte: today, $lt: tomorrow }
        })
            .select("coinId prix")
            .lean();

        const mapHistory = new Map(histories.map(h => [h.coinId, h.prix]));

        const achatsBTC = await AchatCoinEnBtc.aggregate([
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

        const mapAchatsBTC = new Map(
            achatsBTC.map(a => [
                a._id,
                {
                    totalNombre: a.totalNombre,
                    prixAchatMoyen: a.prixAchatMoyen
                }
            ])
        );

        // 🔥 Construire le résultat avec Promise.all
        const result = await Promise.all(
            coins.map(async (c) => {
                const key = c.symbol.toLowerCase();
                const achatBTC = mapAchatsBTC.get(key);

                const todayHistory = await History.findOne({
                    coinId: c.coinId,
                    journee: { $gte: today, $lt: tomorrow }
                }).lean();

                const cibleHistory = await History.findOne({
                    coinId: c.coinId,
                    journee: {
                        $gte: cibleDate,
                        $lt: new Date(cibleDate.getTime() + 86400000)
                    }
                }).lean();

                let evolution = null;
                if (todayHistory?.prix && cibleHistory?.prix) {
                    evolution = ((todayHistory.prix - cibleHistory.prix) / cibleHistory.prix) * 100;
                }
                return {
                    ...c,
                    nombre: achatBTC ? achatBTC.totalNombre : 0,
                    prixCoin: achatBTC ? achatBTC.prixAchatMoyen : 0,
                    prixHistory: mapHistory.get(c.coinId) || null,
                    dateCible: cibleDate.toLocaleDateString("fr-FR"),
                    btcToday,
                    evolution,
                    capitalisation: todayHistory?.market_cap || null,
                };
            })
        );

        res.status(200).json(result);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DETAIL ACHAT
exports.getDetailAchatCoins = async (req, res) => {
    try {
        const coinsDetail = await AchatCoin.find()
            .sort({ dateAchat: -1 }) // tri logique
            .lean();

        res.status(200).json(coinsDetail);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createDetailAchat = async (req, res) => {
    try {
        const { symbol, dateAchat, stockage, nombre, prixAchat, observation } = req.body;

        if (!symbol || !dateAchat || !nombre || !prixAchat) {
            return res.status(400).json({ error: "Champs manquants" });
        }

        const achatCoin = await AchatCoin.create({ symbol, dateAchat, stockage, nombre, prixAchat, observation });

        res.status(201).json(achatCoin);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateDetailAchat = async (req, res) => {
    try {
        const id = req.params.id;

        const updateFields = req.body; // contient { field: value }

        const updated = await AchatCoin.findByIdAndUpdate(
            id,
            updateFields,
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ error: "Achat non trouvé" });
        }

        res.status(200).json(updated);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteDetailAchat = async (req, res) => {
    const id = req.params.id;

    try {
        await AchatCoin.deleteOne({ _id: id });

        res.status(201).json({ message: "Suppression réussie" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getDetailAchatCoinsEnBtc = async (req, res) => {
    try {
        const coinsDetailEnBtc = await AchatCoinEnBtc.find()
            .sort({ dateAchat: -1 }) // tri logique
            .lean();

        res.status(200).json(coinsDetailEnBtc);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createDetailAchatEnBtc = async (req, res) => {
    try {
        const { symbol, dateAchat, stockage, nombre, prixAchat, observation } = req.body;

        if (!symbol || !dateAchat || !nombre || !prixAchat) {
            return res.status(400).json({ error: "Champs manquants" });
        }

        const achatCoinEnBtc = await AchatCoinEnBtc.create({ symbol, dateAchat, stockage, nombre, prixAchat, observation });

        res.status(201).json(achatCoinEnBtc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateDetailAchatEnBtc = async (req, res) => {
    try {
        const id = req.params.id;

        const updateFields = req.body; // contient { field: value }

        const updated = await AchatCoinEnBtc.findByIdAndUpdate(
            id,
            updateFields,
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ error: "Achat non trouvé" });
        }

        res.status(200).json(updated);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteDetailAchatEnBtc = async (req, res) => {
    const id = req.params.id;

    try {
        await AchatCoinEnBtc.deleteOne({ _id: id });

        res.status(201).json({ message: "Suppression réussie" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// READ ONE
exports.getCoinById = async (req, res) => {
    try {
        const coin = await Coin.findById(req.params.id);
        if (!coin) return res.status(404).json({ error: "Coin introuvable" });
        res.json(coin);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE
exports.updateCoin = async (req, res) => {
    try {
        const updated = await Coin.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updated) return res.status(404).json({ error: "Coin introuvable" });

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE
exports.deleteCoin = async (req, res) => {
    try {
        const deleted = await Coin.findByIdAndDelete(req.params.id);

        if (!deleted) return res.status(404).json({ error: "Coin introuvable" });

        res.json({ message: "Coin supprimé", deleted });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getCoinBySymbol = async (req, res) => {
    try {
        const coin = await Coin.findOne({ symbol: req.params.symbol.toLowerCase() });
        if (!coin) return res.status(404).json({ error: "Coin introuvable" });
        res.json(coin);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getNote = async (req, res) => {
    const note = await Note.findOne({ walletId: "main" });
    res.json(note || { content: "" });
};

exports.saveNote = async (req, res) => {
    const { content } = req.body;

    const note = await Note.findOneAndUpdate(
        { walletId: "main" },
        { content, updatedAt: new Date() },
        { upsert: true, new: true }
    );

    res.json(note);
};