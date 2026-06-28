import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Achats = ({ search = '' }) => {

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [dataBtc, setDataBtc] = useState([]);
    const [stables, setStables] = useState(0);
    const [prixStable, setPrixStable] = useState(0);
    const [dominance, setDominance] = useState(0);
    const [btcPriceToday, setBtcPriceToday] = useState(0);
    const [btcCapitalisation, setBtcCapitalisation] = useState(0);
    const [btcNombre, setBtcNombre] = useState(0);
    const [btcEvolution, setBtcEvolution] = useState(0);
    const [btcEcart, setBtcEcart] = useState(0);
    const [mode, setMode] = useState("eur"); // "eur" ou "btc"

    useEffect(() => {
        fetchDominance();
        fetchRecapData();
        fetchData();
    }, []);

    useEffect(() => {
        const dominanceCalculee = dominance > 0 ? (btcCapitalisation / dominance) * 100 : 0;
        const dominanceCoin = dominance > 0 ? (btcCapitalisation / dominanceCalculee) * 1000000 : 0;
        const estimationWalletBtc = (btcPriceToday / dominance) * 100;
        const hodlBtc = btcPriceToday > 0
            ? ((estimationWalletBtc * dominanceCoin) / btcPriceToday) / 1000000
            : 0;
        const valeurBtc = btcNombre * btcPriceToday;
        const investMin = (btcEvolution > 0) ? hodlBtc * btcPriceToday : 0;
        const ecart = valeurBtc - investMin;
        setBtcEcart(ecart);
    }, [dominance, btcCapitalisation, btcPriceToday, btcNombre, btcEvolution]);

    console.log(btcEcart);

    const fetchData = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/backend/history/achats`);
            setData(
                [...res.data.achatsData].sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0))
            );
            setDataBtc(
                [...res.data.achatsDataBtc].sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0))
            );
            setStables(res.data.stables || 0);
            setPrixStable(res.data.prixStable || 0);
            setBtcNombre(res.data.btcNombre || 0);
            setBtcEvolution(res.data.btcEvolution || 0);
            setBtcPriceToday(res.data.btcPrice);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDominance = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/backend/param`);
            if (res.data) {
                setDominance(res.data.dominance);
            }
        } catch (err) {
            console.error("Erreur chargement params", err);
        }
    };

    const fetchRecapData = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/backend/history/recap`);
            if (res.data && res.data.length > 0) {
                const btc = res.data.find(c =>
                    c.symbol.toLowerCase() === "btc" || c.coinId === "bitcoin"
                );

                if (btc) {
                    setBtcCapitalisation(btc.capitalisation);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const normalizedSearch = (search || '').trim().toLowerCase();

    const filteredData = data.filter(c =>
        !normalizedSearch ||
        c.symbol.toLowerCase().includes(normalizedSearch) ||
        c.name.toLowerCase().includes(normalizedSearch)
    );

    const filteredDataBtc = dataBtc.filter(c =>
        !normalizedSearch ||
        c.symbol.toLowerCase().includes(normalizedSearch) ||
        c.name.toLowerCase().includes(normalizedSearch)
    );

    const formatNumber6 = (value) => {
        if (value === null || value === undefined) return "-";
        return value.toLocaleString("fr-FR", { maximumFractionDigits: 6 });
    };

    const formatNumber0 = (value) => {
        if (value === null || value === undefined) return "-";
        return value.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
    };

    const formatCurrency6 = (n) =>
        new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 6
        }).format(n);

    const formatCurrency0 = (n) =>
        new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(n);

    const formatCurrency0D = (n) =>
        new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(n);

    const formatCurrency12B = (n) =>
        new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'BTC',
            minimumFractionDigits: 0,
            maximumFractionDigits: 12
        }).format(n);

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center">

                {/* Bloc gauche */}
                <div className="d-flex align-items-center">
                    <h1>Achats</h1>

                    <button
                        className={`btn btn-sm btn-currency mb-4 ml-3 ${mode === "eur" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setMode("eur")}
                    >
                        <img src="/img/eur.png" style={{ width: 28 }} alt='EUR' />
                    </button>

                    <button
                        className={`btn btn-sm btn-currency mb-4 ml-2 ${mode === "btc" ? "btn-warning" : "btn-outline-warning"}`}
                        onClick={() => setMode("btc")}
                    >
                        <img src="/img/btc.png" style={{ width: 28 }} alt='BTC' />
                    </button>
                </div>

                {mode === "eur" && (
                    <>
                        <h5 className="mb-0">Disponible : {formatCurrency0D((stables / 10) / prixStable)}{ }</h5>
                    </>
                )}
                {mode === "btc" && (
                    <>
                        <h5 className="mb-0">Disponible : {btcEcart / btcPriceToday > (prixStable * 10) / btcPriceToday ? formatCurrency12B((btcEcart / btcPriceToday) / 10) : 0}</h5>
                    </>
                )}
            </div>

            <div className="card p-4">
                {mode === "eur" && (
                    <>
                        {loading ? (
                            <p>Chargement...</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead className="table-dark">
                                        <tr>
                                            <th className='text-center'>Symbole</th>
                                            <th className='text-center'>Nom</th>
                                            <th className='text-center'>Prix Aujourd'hui</th>
                                            <th className='text-center'>Prix Hier</th>
                                            <th className='text-center'>Évol. Cible %</th>
                                            <th className='text-center'>Market Cap</th>
                                            <th className='text-center'>Volume</th>
                                            <th className='text-center'>InvMax</th>
                                            <th className='text-center'>Valeur Achat</th>
                                            <th className='text-center'>Valeur Réelle</th>
                                            <th className='text-center'>Achat</th>
                                            <th className='text-center'>Transaction</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredData.map((coin, index) => {

                                            const dominanceCalculee = dominance > 0
                                                ? (btcCapitalisation / dominance) * 100
                                                : 0;

                                            const prixDuJour = Number(coin.prixAuj);
                                            const tranche = stables / 10;
                                            const eurConvertit = coin.prixAuj / prixStable;
                                            
                                            const dominanceCoin = dominance > 0
                                                ? (coin.market_cap / dominanceCalculee) * 1000000
                                                : 0;

                                            const nombre = Number(coin.nombre) || 0;
                                            const valeurAchat = nombre * (Number(coin.prixCoin) || 0);
                                            const valeur = nombre * prixDuJour;

                                            const invBase = valeurAchat > valeur ? valeurAchat : valeur;
                                            const invCalcul = dominanceCoin - invBase;
                                            const invReel = invCalcul > tranche ? tranche : invCalcul;
                                            const invReelFinal = invReel > 0 ? invReel : 0;

                                            return (
                                                <tr key={index}>
                                                    <td className={`text-center ${valeurAchat < dominanceCoin && valeur < dominanceCoin
                                                        ? "table-success"
                                                        : ""
                                                        }`}>
                                                        <strong>{coin.symbol}</strong>
                                                    </td>

                                                    <td className='text-center'>{coin.name}</td>
                                                    <td className='text-center'>{formatCurrency6(coin.prixAuj)}</td>
                                                    <td className='text-center'>{formatCurrency6(coin.prixHier)}</td>
                                                    <td className='text-center'>
                                                        {coin.evolution === null ? "-" : `${formatNumber0(coin.evolution)} %`}
                                                    </td>
                                                    <td className='text-center'>{formatCurrency0(coin.market_cap)}</td>
                                                    <td className='text-center'>{formatCurrency0(coin.total_volume)}</td>
                                                    <td className='text-center'>{formatCurrency0(dominanceCoin)}</td>
                                                    <td className='text-center'>{formatCurrency0(valeurAchat)}</td>
                                                    <td className='text-center'>{formatCurrency0(valeur)}</td>
                                                    <td className='text-center'>{formatCurrency0D(invReelFinal / prixStable)}</td>
                                                    <td className='text-center'>{formatNumber6((invReelFinal / prixStable) / eurConvertit)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {mode === "btc" && (
                    <>                {loading ? (
                        <p>Chargement...</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead className="table-dark">
                                    <tr>
                                        <th className='text-center'>Symbole</th>
                                        <th className='text-center'>Nom</th>
                                        <th className='text-center'>Prix Aujourd'hui</th>
                                        <th className='text-center'>Prix Hier</th>
                                        <th className='text-center'>Prix Cible</th>
                                        <th className='text-center'>Évol. Cible %</th>
                                        <th className='text-center'>InvMax</th>
                                        <th className='text-center'>Valeur Achat</th>
                                        <th className='text-center'>Valeur Réelle</th>
                                        <th className='text-center'>Achat</th>
                                        <th className='text-center'>Transaction</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDataBtc.map((coin, index) => {

                                        // 🔥 AJOUT OBLIGATOIRE
                                        const dominanceCalculee = dominance > 0
                                            ? (btcCapitalisation / dominance) * 100
                                            : 0;

                                        const prixDuJour = Number(coin.prixAujBtc);
                                        const tranche = (btcEcart / btcPriceToday) / 10;

                                        const dominanceCoin = dominance > 0
                                            ? (coin.market_cap / dominanceCalculee) * 1000000
                                            : 0;

                                        const nombre = Number(coin.nombre) || 0;
                                        const valeurAchat = nombre * (Number(coin.prixCoin) || 0);
                                        const valeur = nombre * prixDuJour;

                                        const invBase = valeurAchat > valeur ? valeurAchat / btcPriceToday : valeur / btcPriceToday;
                                        const invCalcul = (dominanceCoin/btcPriceToday) - invBase;
                                        const invReel = invCalcul > tranche ? tranche : invCalcul;
                                        const invReelFinal = invReel > 0 ? invReel : 0;

                                        return (
                                            <tr key={index}>
                                                <td className={`text-center ${valeurAchat < dominanceCoin && valeur < dominanceCoin
                                                    ? "table-success"
                                                    : ""
                                                    }`}>
                                                    <strong>{coin.symbol}</strong>
                                                </td>

                                                <td className='text-center'>{coin.name}</td>
                                                <td className='text-center'>{formatCurrency12B(coin.prixAujBtc)}</td>
                                                <td className='text-center'>{formatCurrency12B(coin.prixHierBtc)}</td>
                                                <td className='text-center'>{formatCurrency12B(coin.prixCibleBtc)}</td>
                                                <td className='text-center'>
                                                    {coin.evolutionBtc === null ? "-" : `${formatNumber0(coin.evolutionBtc)} %`}
                                                </td>
                                                <td className='text-center'>{formatCurrency12B(dominanceCoin / btcPriceToday)}</td>
                                                <td className='text-center'>{formatCurrency12B(valeurAchat / btcPriceToday)}</td>
                                                <td className='text-center'>{formatCurrency12B(valeur)}</td>
                                                <td className='text-center'>{formatCurrency12B(invReelFinal)}</td>
                                                <td className='text-center'>{formatNumber6(invReelFinal / coin.prixAujBtc)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Achats;