const CoinModel = require("../models/coin.model");

module.exports.createCoin = async (req, res) => {
    const {no, coinId, symbol, name, dateAchat, nombre, prix, stockage, dateVerif, observation} = req.body

    try {
        const coin = await CoinModel.create({no, coinId, symbol, name, dateAchat, nombre, prix, stockage, dateVerif, observation});
        res.status(201).json({ coin: coin._id})
    }
    catch(err) {
        res.status(200).send({ err })
    }
}

module.exports.getAllCoins = async (req, res) => {
    const coins = await CoinModel.find().select();
    res.status(200).json(coins);
}

module.exports.coinInfo = async (req, res) => {
    try {
        const coin = await CoinModel.findOne({ symbol: req.params.symbol });
        if (!coin) {
            return res.status(404).send("Symbol unknown");
        }
        res.send(coin);
    } catch (err) {
        console.error("Error fetching coin:", err);
        res.status(500).send("Server error");
    }
};

module.exports.updateCoin = async (req, res) => {
    try {
        const updatedCoin = await CoinModel.findOneAndUpdate(
            { symbol: req.params.symbol },
            { $set: req.body },
            {
                new: true,
                upsert: false, // Désactive upsert pour éviter la création accidentelle
                runValidators: true // Active les validateurs du schéma
            }
        );

        if (!updatedCoin) {
            return res.status(404).send({ message: "Coin non trouvé" });
        }

        return res.send(updatedCoin);
    } catch (err) {
        return res.status(500).send({ message: err });
    }
};

module.exports.deleteCoin = async (req, res) => {
    try {
        const deletedCoin = await CoinModel.findOneAndDelete({ symbol: req.params.symbol });
        if (!deletedCoin) {
            return res.status(404).json({ message: "Coin non trouvé" });
        }
        res.status(200).json({ message: "Coin supprimé avec succès", deletedCoin });
    } catch (err) {
        console.error("Erreur lors de la suppression :", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};
