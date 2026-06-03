const CoinListModel = require("../models/coinList.model");

module.exports.createCoin = async (req, res) => {
    //console.log(req.body);
    const {no, coinId, symbol, name, dateAchat, nombre, prix, stockage, dateVerif, observation} = req.body

    try {
        const coin = await CoinListModel.create({no, coinId, symbol, name, dateAchat, nombre, prix, stockage, dateVerif, observation});
        res.status(201).json({ coin: coin._id})
    }
    catch(err) {
        res.status(200).send({ err })
    }
}