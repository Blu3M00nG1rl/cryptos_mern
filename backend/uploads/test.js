const axios = require("axios");

async function runImport() {
    try {
        const API = process.env.API_URL;

        console.log("➡️  Appel import Bitcoin :", `${API}/bitcoin/importB`);
        const r1 = await axios.post(`${API}/bitcoin/importB`);
        console.log("✔️ Import Bitcoin OK");

        res.status(200).json({
            message: "Mise à jour complète terminée",
            bitcoin: r1.data
        });

    } catch (err) {
        console.error("❌ Erreur MAJ :", err.message);

        // 🔥 LOG COMPLET POUR DEBUG
        if (err.response) {
            console.error("➡️ Status :", err.response.status);
            console.error("➡️ URL :", err.config.url);
            console.error("➡️ Data :", err.response.data);
        }
    }
};

runImport();