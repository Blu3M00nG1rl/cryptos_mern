const Coin = require("../models/coin.model");
const History = require("../models/history.model");
const Bitcoin = require("../models/bitcoin.model");

async function getMaxDiffValue() {
    const row = await Bitcoin.findOne().sort({ diff: -1 }).lean();
    return row ? row.diff : 0;
}

// CREATE
exports.createCoin = async (req, res) => {
    try {
        const { no, coinId, symbol, name } = req.body;

        if (!no || !coinId || !symbol || !name) {
            return res.status(400).json({ error: "Champs manquants" });
        }

        const coin = await Coin.create({ no, coinId, symbol, name, nombre: 0 });

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

        // 🔥 Lire maxDiff directement dans MongoDB
        const maxDiff = await getMaxDiffValue();
        console.log("maxDiff =", maxDiff);

        // 🔥 Date de projection = today - maxDiff jours
        const projectionDate = new Date(today);
        projectionDate.setDate(projectionDate.getDate() - maxDiff);

        const coinIds = coins.map(c => c.coinId);

        const histories = await History.find({
            coinId: { $in: coinIds },
            journee: { $gte: today, $lt: tomorrow }
        })
            .select("coinId prix")
            .lean();

        const map = new Map(histories.map(h => [h.coinId, h.prix]));

        const result = coins.map(c => ({
            ...c,
            prixCoin: c.prix,                     // 🔥 prix stocké dans coins
            prixHistory: map.get(c.coinId) || null, // 🔥 prix du jour dans histories
            dateProjection: projectionDate.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric"
            })

        }));

        res.status(200).json(result);

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

