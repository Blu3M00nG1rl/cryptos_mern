const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
    {
        coinId: {
            type: String,
            required: true
        },
        journee: {
            type: Date
        },
        prix: {
            type: Number
        },
        market_cap: {
            type: Number
        },
        total_volume: {
            type: Number
        }
    },
    {
        timestamps: true
    }
);

historySchema.index({ coinId: 1, journee: 1 });

const HistoryModel = mongoose.model("history", historySchema);

module.exports = HistoryModel;