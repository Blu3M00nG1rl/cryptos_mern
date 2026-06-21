const mongoose = require("mongoose");

const bitcoinSchema = new mongoose.Schema(
    {
        dateCours: {
            type: Date
        },
        prix: {
            type: Number
        },
        diff: {
            type: Number
        },
        dateDepassement: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

const BitcoinModel = mongoose.model("bitcoin", bitcoinSchema);

module.exports = BitcoinModel;