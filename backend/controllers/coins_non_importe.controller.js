const CoinsNonImporte = require("../models/coins_non_importe.model");

exports.createCoinNI = async (req, res) => {
    const {symbol} = req.body;

    try {
        const coin = await CoinsNonImporte.create({symbol});
        res.status(201).json({ message: "Création "+symbol+" réussie" })
    }
    catch(err) {
        res.status(500).send({ error: err.message  })
    }
}

exports.deleteCoinsNI = async (req, res) => {
     try {
        await CoinsNonImporte.deleteMany();
        res.status(201).json({ message: "Suppression réussie" });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
    
}