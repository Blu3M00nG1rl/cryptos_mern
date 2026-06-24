import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Achats = ({ search = '' }) => {

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [dataBtc, setDataBtc] = useState([]);
    const [stables, setStables] = useState(0);
    const [prixStable, setPrixStable] = useState(0);
    const [dominance, setDominance] = useState(0);
    const [btcCapitalisation, setBtcCapitalisation] = useState(0);
    const [mode, setMode] = useState("eur"); // "eur" ou "btc"
    const [activeTab, setActiveTab] = useState("eur");

    useEffect(() => {
        fetchDominance();
        fetchRecapData();
        fetchData();
    }, []);

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

    const formatCurrencyD0 = (n) =>
        new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(n);

    const dominanceCalculee = dominance > 0 ? (btcCapitalisation / dominance) * 100 : 0;

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

                {/* Bloc droite */}
                <h5 className="mb-0">Disponible : {formatCurrencyD0((stables / 10)/prixStable)}</h5>
            </div>

            <ul className="nav nav-tabs mb-3">
                {mode === "eur" && (
                    <>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === "eur" ? "active" : ""}`}
                                onClick={() => setActiveTab("eur")}
                            >
                                Eur
                            </button>
                        </li>
                    </>
                )}
                {mode === "btc" && (
                    <>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === "btc" ? "active" : ""}`}
                                onClick={() => setActiveTab("btc")}
                            >
                                Btc
                            </button>
                        </li>
                    </>
                )}
            </ul>

            <div className="card p-4">
                {mode === "eur" && activeTab === "eur" && (
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
                                            <th className='text-center'>Évolution %</th>
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
                                            const prixDuJour = Number(coin.prixAuj);
                                            const tranche = stables / 10;
                                            const eurConvertit = coin.prixAuj / prixStable;
                                            const dominanceCoin = dominance > 0 ? (coin.market_cap / dominanceCalculee) * 1000000 : 0;
                                            const nombre = Number(coin.nombre) || 0;
                                            const valeurAchat = nombre * (Number(coin.prixCoin) || 0);
                                            const valeur = nombre * prixDuJour;
                                            const invBase = valeurAchat > valeur ? valeurAchat : valeur;
                                            const invCalcul = dominanceCoin - invBase;
                                            const invReel = invCalcul > tranche ? tranche : invCalcul;
                                            const invReelFinal = invReel > 0 ? invReel : 0;
                                            const evolution24h = ((coin.prixAuj - coin.prixHier) / coin.prixHier) * 100;
                                            console.log(evolution24h);
                                            console.log(coin.symbol + ' : (' +coin.prixAuj+' - '+coin.prixHier+') / '+coin.prixHier+') * 100 = ' +evolution24h);
                                            return (
                                                <tr key={index}>
                                                    <td className={`text-center ${valeurAchat < dominanceCoin && valeur < dominanceCoin
                                                        ? "table-success"
                                                        : ""}`
                                                    }><strong>{coin.symbol}</strong></td>
                                                    <td className='text-center'>{coin.name}</td>
                                                    <td className='text-center'>{formatCurrency6(coin.prixAuj)}</td>
                                                    <td className='text-center'>{formatCurrency6(coin.prixHier)}</td>
                                                    <td className='text-center'>{coin.evolution === null ? "-" : `${formatNumber0(coin.evolution)} %`}</td>
                                                    <td className='text-center'>{formatCurrency0(coin.market_cap)}</td>
                                                    <td className='text-center'>{formatCurrency0(coin.total_volume)}</td>
                                                    <td className='text-center'>{formatCurrency0(dominanceCoin)}</td>
                                                    <td className='text-center'>{formatCurrency0(valeurAchat)}</td>
                                                    <td className='text-center'>{formatCurrency0(valeur)}</td>
                                                    <td className='text-center'>{formatCurrencyD0(invReelFinal / prixStable)}</td>
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

                {mode === "btc" && activeTab === "btc" && (
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
                                        <th className='text-center'>Évolution %</th>
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
                                    {filteredDataBtc.map((coin, index) => {
                                        const prixDuJour = Number(coin.prixAujBtc);
                                        const tranche = stables / 10;
                                        const eurConvertit = coin.prixAuj / prixStable;
                                        const dominanceCoin = dominance > 0 ? (coin.market_cap / dominanceCalculee) * 1000000 : 0;
                                        const nombre = Number(coin.nombreEnBtc) || 0;
                                        const valeurAchat = nombre * (Number(coin.prixCoinEnBtc) || 0);
                                        const valeur = nombre * prixDuJour;
                                        const invBase = valeurAchat > valeur ? valeurAchat : valeur;
                                        const invCalcul = dominanceCoin - invBase;
                                        const invReel = invCalcul > tranche ? tranche : invCalcul;
                                        const invReelFinal = invReel > 0 ? invReel : 0;

                                        return (
                                            <tr key={index}>
                                                <td className={`text-center ${valeurAchat < dominanceCoin && valeur < dominanceCoin
                                                    ? "table-success"
                                                    : ""}`
                                                }><strong>{coin.symbol}</strong></td>
                                                <td className='text-center'>{coin.name}</td>
                                                <td className='text-center'>{formatCurrency6(coin.prixAujBtc)}</td>
                                                <td className='text-center'>{formatCurrency6(coin.prixHierBtc)}</td>
                                                <td className='text-center'>{coin.evolutionBtc === null ? "-" : `${formatNumber0(coin.evolutionBtc)} %`}</td>
                                                <td className='text-center'>{formatCurrency0(coin.market_cap)}</td>
                                                <td className='text-center'>{formatCurrency0(coin.total_volume)}</td>
                                                <td className='text-center'>{formatCurrency0(dominanceCoin)}</td>
                                                <td className='text-center'>{formatCurrency0(valeurAchat)}</td>
                                                <td className='text-center'>{formatCurrency0(valeur)}</td>
                                                <td className='text-center'>{formatCurrencyD0(invReelFinal / prixStable)}</td>
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
            </div>
        </div>
    );
};

export default Achats;
