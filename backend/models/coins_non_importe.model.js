const mongoose = require("mongoose");

const coins_non_importeSchema = new mongoose.Schema(
    {
        symbol: {
            type: String,
            required: true,
            unique: true
        }
    },
    {
        timestamps: true
    }
);

const CoinsNonImporteModel = mongoose.model("coins_non_importes", coins_non_importeSchema );

module.exports = CoinsNonImporteModel;