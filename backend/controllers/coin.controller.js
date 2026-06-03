const Coin = require("../models/coin.model");

const { createCoinService } = require("../services/coin.service");

exports.createCoin = async (req, res) => {
    try {
        const coin = await createCoinService(req.body);
        res.status(201).json({ coin: coin._id });
    } catch (err) {
        res.status(500).json({ err });
    }
};

exports.getAllCoins = async (req, res) => {
    const coins = await Coin.find().select();
    res.status(200).json(coins);
}

exports.coinInfo = async (req, res) => {
    try {
        const coin = await Coin.findOne({ symbol: req.params.symbol });
        if (!coin) {
            return res.status(404).send("Symbol unknown");
        }
        res.send(coin);
    } catch (err) {
        console.error("Error fetching coin:", err);
        res.status(500).send("Server error");
    }
};

exports.updateCoin = async (req, res) => {
    try {
        const updatedCoin = await Coin.findOneAndUpdate(
            { symbol: req.params.symbol },
            { $set: req.body },
            {
                new: true,
                upsert: false, // Désactive upsert pour éviter la création accidentelle
                runValidators: true // Active les validateurs du schéma
            }
        );

        if (!updatedCoin) {
            return res.status(404).send({ message: "Coin non mis à jour" });
        }

        return res.send(updatedCoin);
    } catch (err) {
        return res.status(500).send({ message: err });
    }
};

exports.deleteCoin = async (req, res) => {
    try {
        const deletedCoin = await Coin.findOneAndDelete({ symbol: req.params.symbol });
        if (!deletedCoin) {
            return res.status(404).json({ message: "Echec de la suppression" });
        }
        res.status(200).json({ message: "Coin supprimé avec succès", deletedCoin });
    } catch (err) {
        console.error("Erreur lors de la suppression du coin :", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};
