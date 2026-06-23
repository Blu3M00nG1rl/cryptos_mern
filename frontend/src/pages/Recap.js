import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Recap = ({ search = '' }) => {
    const [tableLoading, setTableLoading] = useState(true);
    const [data, setData] = useState([]);
    const [dateCible, setDateCible] = useState('');
    const [btcPrix, setBtcPrix] = useState(0);
    const [btcPrixCible, setBtcPrixCible] = useState(0);
    const [btcCapitalisation, setBtcCapitalisation] = useState(0);
    const [btcEvolution, setBtcEvolution] = useState(0);
    const [dominance, setDominance] = useState(0);
    const [activeTab, setActiveTab] = useState("tous");
    const [nonTrouves, setNonTrouves] = useState([]);
    const [nonImportes, setNonImportes] = useState([]);
    const [mode, setMode] = useState("eur"); // "eur" ou "btc"

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
            setTableLoading(true);
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/backend/history/recap`);
            if (res.data && res.data.length > 0) {
                setDateCible(res.data[0].dateCible);
                setData(res.data);
                const btc = res.data.find(c =>
                    c.symbol.toLowerCase() === "btc" || c.coinId === "bitcoin"
                );

                if (btc) {
                    setBtcPrix(btc.prixDuJour); // 🔥 prix du jour du BTC
                    setBtcCapitalisation(btc.capitalisation);
                    setBtcEvolution(btc.evolution);
                    setBtcPrixCible(btc.prixCible);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setTableLoading(false);
        }
    };

    const fetchNonTrouves = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/backend/coins_non_trouve`);
            setNonTrouves(res.data || []);
        } catch (err) {
            console.error("Erreur non trouvés", err);
        }
    };

    const fetchNonImportes = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/backend/coins_non_importe`);
            setNonImportes(res.data || []);
        } catch (err) {
            console.error("Erreur non importés", err);
        }
    };


    useEffect(() => {
        fetchDominance();
        fetchRecapData();
        fetchNonTrouves();
        fetchNonImportes();
    }, []);


    const normalizedSearch = (search || '').trim().toLowerCase();

    const filteredData = data.filter(c =>
        !normalizedSearch ||
        c.symbol.toLowerCase().includes(normalizedSearch) ||
        c.name.toLowerCase().includes(normalizedSearch)
    );

    const formatNumber = (value) => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'number') {
            return value.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
        }
        return value;
    };

    const formatNumberE = (value) => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'number') {
            return value.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
        }
        return value;
    };

    const formatCurrency0 = (n) =>
        new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(n);

    const formatCurrency12 = (n) =>
        new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 12
        }).format(n);

    const formatCurrencyB12 = (n) =>
        new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'BTC',
            minimumFractionDigits: 0,
            maximumFractionDigits: 12
        }).format(n);

    const dominanceCalculee = dominance > 0 ? (btcCapitalisation / dominance) * 100 : 0;
    // Estimation Wallet
    const estimationWallet = (btcPrix / dominance) * 100;
    const totalNombre = filteredData.reduce((sum, c) => sum + (Number(c.nombre) || 0), 0);
    const totalDominanceCoin = filteredData.reduce((sum, c) => sum + ((c.capitalisation / dominanceCalculee) * 1000000), 0);

    return (
        <div>
            <div className="d-flex">
                <h1>Recap</h1>

                <button
                    className={`btn btn-sm btn-currency mb-4 ${mode === "eur" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setMode("eur")}
                >
                    <img src="/img/eur.png" style={{ width: 28 }} />
                </button>

                <button
                    className={`btn btn-sm btn-currency mb-4 ${mode === "btc" ? "btn-warning" : "btn-outline-warning"}`}
                    onClick={() => setMode("btc")}
                >
                    <img src="/img/btc.png" style={{ width: 28 }} />
                </button>


            </div>

            <ul className="nav nav-tabs mb-3">
                {mode === "eur" && (
                    <>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === "tous" ? "active" : ""}`}
                                onClick={() => setActiveTab("tous")}
                            >
                                Tous
                            </button>
                        </li>

                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === "nonTrouves" ? "active" : ""}`}
                                onClick={() => setActiveTab("nonTrouves")}
                            >
                                Non Trouvés
                            </button>
                        </li>

                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === "nonImportes" ? "active" : ""}`}
                                onClick={() => setActiveTab("nonImportes")}
                            >
                                Non Importés
                            </button>
                        </li>
                    </>
                )}
                {mode === "btc" && (
                    <>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === "tousB" ? "active" : ""}`}
                                onClick={() => setActiveTab("tousB")}
                            >
                                Tous Bitcoin
                            </button>
                        </li>

                    </>
                )}
            </ul>
            <div className="card p-4">

                {mode === "eur" && activeTab === "tous" && (
                    <>
                        {tableLoading ? (
                            <div className="text-center">
                                <p>Chargement des données...</p>
                            </div>
                        ) : data.length === 0 ? (
                            <div className="alert alert-info">Aucune donnée disponible</div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead className="table-dark">
                                        <tr>
                                            <th></th>
                                            <th className="text-center">Rang</th>
                                            <th className="text-center">Coins</th>
                                            <th className="text-center">ID</th>
                                            <th className="text-center">Portefeuille</th>
                                            <th className="text-center">Prix du jour</th>
                                            <th className="text-center">Capitalisation</th>
                                            <th className="text-center">Volume 24h</th>
                                            <th className="text-center">Prix au {dateCible}</th>
                                            <th className="text-center">Évolution</th>
                                            <th className="text-center">Invest. Min</th>
                                            <th className="text-center">Écart</th>
                                            <th className="text-center">Invest. (Dominance)</th>
                                            <th className="text-center">Hodl</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredData.map((coin, index) => {

                                            const dominanceCoin =
                                                dominance > 0 ? (coin.capitalisation / dominanceCalculee) * 1000000 : 0;

                                            const hodl = ((estimationWallet * dominanceCoin) / coin.prixDuJour) / 1000000;
                                            const investMin = (coin.evolution > 0 && coin.evolution >= btcEvolution) ? hodl * coin.prixDuJour : 0;

                                            return (
                                                <tr
                                                    key={index}
                                                    className={
                                                        coin.rank === "1"
                                                            ? "table-warning"
                                                            : coin.evolution < 0
                                                                ? "table-danger"
                                                                : coin.evolution > btcEvolution
                                                                    ? "table-success"
                                                                    : ""
                                                    }
                                                >
                                                    <td className="text-center">
                                                        <img
                                                            src={`/img/coins/${coin.symbol}.png`}
                                                            alt={coin.symbol}
                                                            style={{ width: 32, height: 32 }}
                                                            onError={(e) => { e.target.src = '/img/random-coin.jpg'; }}
                                                        />
                                                    </td>
                                                    <td className="text-center">{coin.rank}</td>
                                                    <td className="text-center">{coin.name}</td>
                                                    <td className="text-center"><strong>{coin.symbol}</strong></td>
                                                    <td className="text-center">{formatNumber(coin.nombre)}</td>
                                                    <td className="text-center">{formatCurrency12(coin.prixDuJour)}</td>
                                                    <td className="text-center">{formatCurrency0(coin.capitalisation)}</td>
                                                    <td className="text-center">{formatCurrency0(coin.volume24h)}</td>
                                                    <td className="text-center">{formatCurrency12(coin.prixCible)}</td>
                                                    <td className="text-center">{coin.evolution !== null ? formatNumber(coin.evolution) + " %" : "-"}</td>
                                                    <td className="text-center">{formatCurrency0(investMin)}</td>
                                                    <td className="text-center">{formatCurrency0((coin.nombre * coin.prixDuJour) - (investMin))}</td>
                                                    <td className="text-center">{formatCurrency0(dominanceCoin)}</td>
                                                    <td className="text-center">{formatNumber(hodl)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th className="text-center">Total</th>
                                            <th className="text-center">{formatNumberE(totalNombre)}</th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th className="text-center">{formatCurrency0(totalDominanceCoin)}</th>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {mode === "eur" && activeTab === "nonTrouves" && (
                    <div>
                        <h5 className="mb-3">
                            <span className="badge bg-secondary ms-2">{nonTrouves.length}</span>
                        </h5>

                        {nonTrouves.length === 0 ? (
                            <div className="alert alert-info">Aucun coin non trouvé</div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-striped">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Rank</th>
                                            <th>Symbol</th>
                                            <th>Nom</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {nonTrouves.map((coin) => (
                                            <tr key={coin._id}>
                                                <td>{coin.rank}</td>
                                                <td><strong>{coin.symbol}</strong></td>
                                                <td>{coin.name}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {mode === "eur" && activeTab === "nonImportes" && (
                    <div>
                        <h5 className="mb-3">
                            <span className="badge bg-secondary ms-2">{nonImportes.length}</span>
                        </h5>

                        {nonImportes.length === 0 ? (
                            <div className="alert alert-info">Aucun coin non importé</div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-striped">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Symbol</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {nonImportes.map((coin) => (
                                            <tr key={coin._id}>
                                                <td><strong>{coin.symbol}</strong></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {mode === "btc" && activeTab === "tousB" && (
                    <>
                        {tableLoading ? (
                            <div className="text-center">
                                <p>Chargement des données...</p>
                            </div>
                        ) : data.length === 0 ? (
                            <div className="alert alert-info">Aucune donnée disponible</div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead className="table-dark">
                                        <tr>
                                            <th></th>
                                            <th className="text-center">Rang</th>
                                            <th className="text-center">Coins</th>
                                            <th className="text-center">ID</th>
                                            <th className="text-center">Portefeuille</th>
                                            <th className="text-center">Prix du jour</th>
                                            <th className="text-center">Capitalisation</th>
                                            <th className="text-center">Volume 24h</th>
                                            <th className="text-center">Prix au {dateCible}</th>
                                            <th className="text-center">Évolution</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredData.map((coin, index) => {

                                            const dominanceCoin =
                                                dominance > 0 ? (coin.capitalisation / dominanceCalculee) * 1000000 : 0;

                                            const hodl = ((estimationWallet * dominanceCoin) / coin.prixDuJour) / 1000000;
                                            const investMin = (coin.evolution > 0 && coin.evolution >= btcEvolution) ? hodl * coin.prixDuJour : 0;
                                            const prixBtc = coin.prixDuJour / btcPrix;
                                            const prixBtcCible = coin.prixCible / btcPrixCible;
                                            const evolutionEnBtc = (prixBtc - prixBtcCible) / prixBtc;

                                            return (
                                                <tr
                                                    key={index}
                                                    className={
                                                        coin.rank === "1"
                                                            ? "table-warning"
                                                            : coin.evolution < 0
                                                                ? "table-danger"
                                                                : coin.evolution > btcEvolution
                                                                    ? "table-success"
                                                                    : ""
                                                    }
                                                >
                                                    <td className="text-center">
                                                        <img
                                                            src={`/img/coins/${coin.symbol}.png`}
                                                            alt={coin.symbol}
                                                            style={{ width: 32, height: 32 }}
                                                            onError={(e) => { e.target.src = '/img/random-coin.jpg'; }}
                                                        />
                                                    </td>
                                                    <td className="text-center">{coin.rank}</td>
                                                    <td className="text-center">{coin.name}</td>
                                                    <td className="text-center"><strong>{coin.symbol}</strong></td>
                                                    <td className="text-center">{formatNumber(coin.nombre)}</td>
                                                    <td className="text-center">{formatCurrencyB12(prixBtc)}</td>
                                                    <td className="text-center">{formatCurrency0(coin.capitalisation)}</td>
                                                    <td className="text-center">{formatCurrency0(coin.volume24h)}</td>
                                                    <td className="text-center">{formatCurrencyB12(prixBtcCible)}</td>
                                                    <td className="text-center">{evolutionEnBtc !== null ? formatNumber(evolutionEnBtc) + " %" : "-"}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th className="text-center">Total</th>
                                            <th className="text-center">{formatNumberE(totalNombre)}</th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th className="text-center">{formatCurrency0(totalDominanceCoin)}</th>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </>
                )}

            </div>
        </div >
    );
};

export default Recap;
