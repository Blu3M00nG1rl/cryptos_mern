const mongoose = require("mongoose");

const coinSchema = new mongoose.Schema(
    {
        no: {
            type: String,
            required: true,
            unique: true
        },
        coinId: {
            type: String,
            required: true
        },
        symbol: {
            type: String,
            required: true,
            unique: true
        },
        name: {
            type: String,
            required: true
        },
        picture: {
            type: String,
            default: "./random-coin.jpg"
        },
        dateAchat: {
            type: Date
        },
        nombre: {
            type: Number
        },
        prix: {
            type: Number
        },
        stockage: {
            type: String
        },
        dateVerif: {
            type: Date
        },
        observation: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

coinSchema.index({ symbol: 1 });

const CoinModel = mongoose.model("coin", coinSchema);

module.exports = CoinModel;