const History = require("../models/history.model");

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
        res.status(201).json({ history });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
}

exports.deleteHistory = async (req, res) => {
     const { jneeProjection } = req.body;

     try {
        await History.deleteMany({ date: { $lt: jneeProjection } })
        res.status(201).json({ message: "Suppression réussie" });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
    
}
