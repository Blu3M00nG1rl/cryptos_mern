const CoinModel = require("../models/coin.model");

module.exports.createCoin = async (req, res) => {
    //console.log(req.body);
    const {no, coinId, symbol, name, nombre, prix, dateVerif, observation} = req.body

    try {
        const coin = await CoinModel.create({no, coinId, symbol, name, nombre, prix, dateVerif, observation});
        res.status(201).json({ coin: coin._id})
    }
    catch(err) {
        res.status(200).send({ err })
    }
}