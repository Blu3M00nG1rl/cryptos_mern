const mongoose = require("mongoose");

const paramSchema = new mongoose.Schema(
    {
        dominance: {
            type: Number,
            required: true
        },
        marketCapMin: {
            type: Number,
            required: true
        }
    },
    {
        timestamps: true
    }
);

const ParamsModel = mongoose.model("params", paramSchema );

module.exports = ParamsModel;