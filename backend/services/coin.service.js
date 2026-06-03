const Coin = require("../models/coin.model");

exports.createCoinService = async (data) => {
    const coin = await Coin.create(data);
    return coin;
};