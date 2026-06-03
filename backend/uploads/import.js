const axios = require('axios');
require('dotenv').config({ path: '../config/.env' });

// ===== PARAMS
const marketCapMinEUR = process.env.MARKETCAP_MIN_EUR;
const jnee = new Date().toISOString().slice(0, 10);
const jneeProjection = new Date(Date.now() - process.env.NB_JOURS_PROJECTION * 24 * 60 * 60 * 1000);

const coinFind = async (symbol) => {
    const endpoint = process.env.API_URL + "/coin/" + symbol;
    try {
        const response = await axios.get(endpoint);
        return response.data;   // <-- IMPORTANT
    } catch (error) {
        return null;            // <-- indique que le coin n'existe pas
    }
}

const coinNF = async (coinData) => {
    const endpoint = process.env.API_URL + "/coins_non_trouve/create";
    try {
        const response = await axios.post(endpoint, coinData);
    } catch (error) {
        //console.log("Erreur lors de la création du coin non trouvé :", error.message);
    }
}

const history = async (historyData) => {
    const endpoint = process.env.API_URL + "/history/update";
    try {
        const response = await axios.put(endpoint, historyData);
    } catch (error) {
        //console.log("Erreur lors de la création de l'historique :", error.message);
    }
}

const deleteHistory = async (jneeProjection) => {
    const endpoint = process.env.API_URL + "/history/delete";
    try {
        const response = await axios.delete(endpoint, jneeProjection);
    } catch (error) {
        //console.log("Erreur lors de suppression de l'historique :", error.message);
    }
}

const deleteCoinsNF = async () => {
    const endpoint = process.env.API_URL + "/coins_non_trouve/delete";
    try {
        const response = await axios.delete(endpoint);
        console.log("Suppression coins_non_trouvés réussie");
    } catch (error) {
        //console.log("Erreur lors de suppréssion du coin non trouvé :", error.message);
    }
}

// ===== MAIN
async function importCrypto() {
    console.log(new Date().toLocaleTimeString() + " - Début de la mise à jour.");

    // ===== FX USD -> EUR
    const fxRes = await axios.get('https://api.frankfurter.app/latest?from=USD&to=EUR');
    const usdToEur = fxRes.data.rates.EUR;

    if (!usdToEur) throw new Error("Erreur récupération taux USD/EUR");

    // ===== Suppression CoinsNF
    await deleteCoinsNF();

    // ===== Nettoyage historique
    await deleteHistory(jneeProjection);

    let start = 0;
    const limit = 100;
    let stop = false;

    while (!stop) {

        const url = `https://api.coinlore.net/api/tickers/?start=${start}&limit=${limit}`;
        const res = await axios.get(url);
        const data = res.data.data;

        if (!data || data.length === 0) break;

        for (const coin of data) {

            const symbol = coin.symbol.toLowerCase();
            console.log(coin.rank);
            const marketCapEUR = coin.market_cap_usd * usdToEur;

            if (marketCapEUR < marketCapMinEUR) {
                stop = true;
                break;
            }

            const existingCoin = await coinFind(symbol);

            const priceEUR = coin.price_usd * usdToEur;
            const volumeEUR = coin.volume24 * usdToEur;

            if (!existingCoin) {
                await coinNF({
                    rank: coin.rank,
                    symbol: symbol,
                    name: coin.name,
                    prix: priceEUR,
                    market_cap: marketCapEUR,
                    volume: volumeEUR
                });
                console.log(symbol+ " non trouvé");
                continue;
            }

            await history({
                coinId: existingCoin._id,
                journee: jnee,
                prix: priceEUR,
                market_cap: marketCapEUR,
                total_volume: volumeEUR
            });
        }

        start += limit;
    }

    console.log(new Date().toLocaleTimeString() + " - Fin de la mise à jour.");
}

importCrypto();