const mongoose = require("mongoose");

const coins_non_trouveSchema = new mongoose.Schema(
    {
        rank: {
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
        }
    },
    {
        timestamps: true
    }
);

const CoinsNonTrouveModel = mongoose.model("coins_non_trouve", coins_non_trouveSchema );

module.exports = CoinsNonTrouveModel;