const CoinsNonTrouve = require("../models/coins_non_trouve.model");

exports.createCoinNF = async (req, res) => {
    const { rank, symbol, name, prix, market_cap, volume } = req.body

    try {
        const coin = await CoinsNonTrouve.create({ rank, symbol, name, prix, market_cap, volume });
        res.status(201).json({ message: "Création " + symbol + " réussie" })
    }
    catch (err) {
        res.status(500).send({ error: err.message })
    }
}

exports.deleteCoinsNF = async (req, res) => {
    try {
        await CoinsNonTrouve.deleteMany();
        res.status(201).json({ message: "Suppression réussie" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }

}

exports.getCoinsNF = async (req, res) => {
    const data = await CoinsNonTrouve.find().lean();
    res.json(data);
};