const Params = require("../models/params.model");
const History = require("../models/history.model");

exports.getParams = async (req, res) => {
    try {
        const params = await Params.findOne().lean();
        res.status(200).json(params);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateParams = async (req, res) => {
    try {
        const { dominance } = req.body;

        // 1️⃣ Récupérer market cap du Bitcoin aujourd’hui
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const btcHistory = await History.findOne({
            coinId: "bitcoin",
            journee: { $gte: today, $lt: tomorrow }
        }).lean();

        if (!btcHistory?.market_cap) {
            return res.status(400).json({ error: "Impossible de récupérer la market cap du Bitcoin" });
        }

        const btcMarketCap = btcHistory.market_cap;

        // 2️⃣ Calcul automatique
        const marketCapMin = ((btcMarketCap / dominance) * 100)*0.0000051;

        // 3️⃣ Mise à jour ou création
        let params = await Params.findOne();
        if (!params) {
            params = new Params({ dominance, marketCapMin });
        } else {
            params.dominance = dominance;
            params.marketCapMin = marketCapMin;
        }

        await params.save();

        res.status(200).json({
            message: "Paramètres mis à jour",
            params
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

