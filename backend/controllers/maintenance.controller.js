const axios = require("axios");

exports.runMaj = async (req, res) => {
    try {
        const API = process.env.API_URL;

        console.log("➡️  Appel import Bitcoin :", `${API}/bitcoin/importB`);
        const r1 = await axios.post(`${API}/bitcoin/importB`);
        console.log("✔️ Import Bitcoin OK");

        console.log("➡️  Appel importH :", `${API}/history/importH`);
        const r2 = await axios.post(`${API}/history/importH`);
        console.log("✔️ Import Historique OK");

        console.log("➡️  Appel importJ :", `${API}/history/importJ`);
        const r3 = await axios.post(`${API}/history/importJ`);
        console.log("✔️ Import Prix OK");

        res.status(200).json({
            message: "Mise à jour complète terminée",
            bitcoin: r1.data,
            historique: r2.data,
            prix: r3.data
        });

    } catch (err) {
        console.error("❌ Erreur MAJ :", err.message);

        // 🔥 LOG COMPLET POUR DEBUG
        if (err.response) {
            console.error("➡️ Status :", err.response.status);
            console.error("➡️ URL :", err.config.url);
            console.error("➡️ Data :", err.response.data);
        }

        res.status(500).json({ error: err.message });
    }
};

