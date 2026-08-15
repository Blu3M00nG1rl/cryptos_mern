require('dotenv').config({ path: '../config/.env' });
const mongoose = require("mongoose");
const Coin = require("../models/coin.model");
const History = require("../models/history.model");
const Params = require("../models/params.model");

const axios = require("axios");
const jnee = new Date().toISOString().slice(0, 10);

const getMaxDiff = async () => {
    const endpoint = process.env.API_URL + "/bitcoin/max-diff";
    try {
        const response = await axios.get(endpoint);
        console.log("Max diff récupéré :", response.data.diff);
        return response.data.diff || 0;
    } catch (error) {
        console.log("Erreur récupération max_diff :", error.message);
        return 0;
    }
};


async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connecté ✔");
    } catch (err) {
        console.error("Erreur connexion MongoDB :", err);
        process.exit(1);

}

(async () => {
    await connectDB();
    await getMaxDiff();
    mongoose.connection.close();
})();
}
