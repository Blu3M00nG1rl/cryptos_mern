const mongoose = require("mongoose");

const achatCoinSchema = new mongoose.Schema(
    {
        symbol: { type: String, required: true },
        dateAchat: { type: Date },
        stockage: { type: String },
        nombre: { type: Number },
        prixAchat: { type: Number },
        observation: { type: String }
    },
    { timestamps: true }
);

module.exports = mongoose.model("achatCoin", achatCoinSchema);
