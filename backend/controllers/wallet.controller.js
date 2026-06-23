const Coin = require("../models/coin.model");
const History = require("../models/history.model");
const Bitcoin = require("../models/bitcoin.model");

async function getMaxDiffValue() {
    const row = await Bitcoin.findOne().sort({ diff: -1 }).lean();
    return row ? row.diff : 0;
}

exports.getMyWallet = async (req, res) => {
    try {
        const coins = await Coin.find();
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

                // --- 2. Prix cible (maxDiff jours) ---
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() - maxDiff);

                // 2A : prix le plus proche après cible jours
                let historyPast = await History.findOne({
                    coinId: coin.coinId,
                    journee: { $gte: targetDate }
                }).sort({ journee: 1 });

                let cibleJours = null;

                if (historyPast && prixAujourdhui) {
                    const oldPrice = historyPast.prix;
                    const evolution = ((prixAujourdhui - oldPrice) / oldPrice) ;
                    cibleJours = prixAujourdhui + (prixAujourdhui * evolution);
                }

                return {
                    ...coin.toObject(),
                    prixAujourdhui,
                    prixCibleJours: historyPast ? historyPast.prix : null,
                    cibleJours
                };

            })
        );

        res.status(200).json(result);

    } catch (error) {
        console.error("Erreur getWallet :", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};