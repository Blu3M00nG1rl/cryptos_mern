const Coin = require("../models/coin.model");
const History = require("../models/history.model");

exports.getMyWallet = async (req, res) => {
    try {
        const coins = await Coin.find({ nombre: { $gt: 0 } });
        console.log("wallet");
        const result = await Promise.all(
            coins.map(async coin => {

                // --- 1. Prix du jour ---
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const historyToday = await History.findOne({
                    coinId: coin.coinId,
                    journee: { $gte: today }
                }).sort({ journee: 1 });

                const prixAujourdhui = historyToday ? historyToday.prix : null;

                // --- 2. Prix projection jours ---
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() - process.env.NB_JOURS_PROJECTION);

                // 2A : prix le plus proche après projection jours
                let historyPast = await History.findOne({
                    coinId: coin.coinId,
                    journee: { $gte: targetDate }
                }).sort({ journee: 1 });

                let projectionJours = null;

                if (historyPast && prixAujourdhui) {
                    const oldPrice = historyPast.prix;
                    const evolution = ((prixAujourdhui - oldPrice) / oldPrice) ;
                    projectionJours = prixAujourdhui + (prixAujourdhui * evolution);
                }

                return {
                    ...coin.toObject(),
                    prixAujourdhui,
                    prixProjectionJours: historyPast ? historyPast.prix : null,
                    projectionJours
                };

            })
        );

        res.status(200).json(result);

    } catch (error) {
        console.error("Erreur getWallet :", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};