import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Wallet = ({ search = '' }) => {
    const [coins, setCoins] = useState([]);
    const [coinsEnBtc, setCoinsEnBtc] = useState([]);
    const [coinsDetail, setCoinsDetail] = useState([]);
    const [coinsDetailEnBtc, setCoinsDetailEnBtc] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ lastUpdate: null, coinsCount: 0 });
    const [sortConfig, setSortConfig] = useState({ key: "valeur", direction: "desc" });
    const [sortConfigEnBtc, setSortConfigEnBtc] = useState({ key: "valeur", direction: "desc" });
    const [maxDiff, setMaxDiff] = useState(null);
    const [dateCible, setDateCible] = useState(null);
    const [btcPriceToday, setBtcPriceToday] = useState(0);
    const [btcEvolution, setBtcEvolution] = useState(0);
    const [btcCapitalisation, setBtcCapitalisation] = useState(0);
    const [stablePriceToday, setStablePriceToday] = useState(0);
    const [dominance, setDominance] = useState(0);
    const [activeTab, setActiveTab] = useState("groupe");
    const [form, setForm] = useState({
        symbol: "",
        dateAchat: "",
        stockage: "",
        nombre: "",
        prixAchat: "",
        observation: ""
    });
    const [formEnBtc, setFormEnBtc] = useState({
        symbol: "",
        dateAchat: "",
        stockage: "",
        nombre: "",
        prixAchat: "",
        observation: ""
    });
    const [eurValue, setEurValue] = useState("");
    const [stableValue, setStableValue] = useState("");
    const [btcValue, setBtcValue] = useState("");
    const [mode, setMode] = useState("eur"); // "eur" ou "btc"
    const [note, setNote] = useState("");
    const [editBuffer, setEditBuffer] = useState({});
    const [editBufferBtc, setEditBufferBtc] = useState({});

    const normalizedSearch = (search || '').trim().toLowerCase();
    const owned = coins
        .filter(c => c.nombre && Number(c.nombre) > 0)
        .filter((c) =>
            !normalizedSearch ||
            c.symbol.toLowerCase().includes(normalizedSearch) ||
            c.name.toLowerCase().includes(normalizedSearch)
        );

    const ownedEnBtc = coinsEnBtc
        .filter(c => c.nombre && Number(c.nombre) > 0)
        .filter((c) =>
            !normalizedSearch ||
            c.symbol.toLowerCase().includes(normalizedSearch) ||
            c.name.toLowerCase().includes(normalizedSearch)
        );

    const totalNombre = owned.reduce((sum, c) => sum + (Number(c.nombre) || 0), 0);
    const totalValeur = owned.reduce((sum, c) => sum + ((Number(c.nombre) || 0) * (Number(c.prixHistory) || 0)), 0);
    const totalValeurAchat = owned.reduce((sum, c) => sum + ((Number(c.nombre) || 0) * (Number(c.prixCoin) || 0)), 0);
    const totalGainPerte = totalValeur - totalValeurAchat;
    const totalPourcGP = totalValeurAchat > 0 ? (totalGainPerte / totalValeurAchat) * 100 : 0;
    const investissement = Number(process.env.REACT_APP_INVESTISSEMENT) || 0;
    const gain = totalValeur - investissement;
    const gainPourcentage = investissement > 0 ? (gain / investissement) * 100 : 0;
    // Estimation Wallet
    const estimationWallet = (btcPriceToday / dominance) * 100;
    const dominanceCalculee = dominance > 0 ? (btcCapitalisation / dominance) * 100 : 0;
    // Différence
    const difference = (totalValeur - estimationWallet) / estimationWallet;
    // Gain minimum
    const gainMin = (1 / (stablePriceToday * (stablePriceToday * 10))) * 100;

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

    const fetchCoins = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/backend/coin`);
            setCoins(res.data || []);
            const btc = res.data.find(c => c.symbol === "btc" || c.coinId === "bitcoin");
            const usdc = res.data.find(c => c.symbol === "usdc" || c.coinId === "usd-coin");
            const usdt = res.data.find(c => c.symbol === "usdt" || c.coinId === "tether");

            if (btc) {
                setBtcPriceToday(btc.prixHistory); // ou btc.priceEUR selon ton modèle
                setBtcEvolution(btc.evolution);
                setBtcCapitalisation(btc.capitalisation);
            }

            if (usdc || usdt) {
                setStablePriceToday((usdc.prixHistory + usdt.prixHistory) / 2);
            }

            if (res.data?.length > 0) {
                setDateCible(res.data[0].dateCible);
            }

        } catch (err) {
            console.error('Erreur récupération coins', err);
            setCoins([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCoinsEnBtc = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/backend/coin/enBtc`);
            setCoinsEnBtc(res.data || []);
        } catch (err) {
            console.error('Erreur récupération coins', err);
            setCoins([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/backend/history/stats`);
            setStats(res.data);
        } catch (err) {
            console.error('Erreur récupération stats', err);
        }
    };

    const fetchMaxDiff = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/backend/bitcoin/max-diff`);
            setMaxDiff(res.data);
        } catch (err) {
            console.error("Erreur récupération maxDiff", err);
        }
    };

    const fetchAchatCoins = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/backend/coin/detail`);
            setCoinsDetail(res.data || []);
        } catch (err) {
            console.error('Erreur récupération coins', err);
            setCoins([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchAchatCoinsEnBtc = async () => {
        try {
            const resEnBtc = await axios.get(`${process.env.REACT_APP_API_URL}/backend/coin/detailEnBtc`);
            setCoinsDetailEnBtc(resEnBtc.data || []);
        } catch (err) {
            console.error('Erreur récupération coins', err);
            setCoinsEnBtc([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchNote = async () => {
        try {
            const res = await axios.get(
                `${process.env.REACT_APP_API_URL}/backend/coin/note`
            );
            setNote(res.data.content);
        } catch (err) {
            console.error("Erreur récupération Note", err);
        }
    };

    const saveNote = async () => {
        try {
            await axios.post(
                `${process.env.REACT_APP_API_URL}/backend/coin/note`,
                { content: note },
                { headers: { "Content-Type": "application/json" } }
            );
        } catch (err) {
            console.error("Erreur sauvegarde Note", err);
        }
    };

    const formatNumber0 = (n) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);
    const formatNumber2 = (n) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n);
    const formatNumber8 = (n) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 8 }).format(n);

    const formatCurrency0 = (n) =>
        new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(n);

    const formatCurrency2 = (n) =>
        new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(n);

    const formatCurrency12 = (n) =>
        new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 12
        }).format(n);

    const formatCurrency12B = (n) =>
        new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'BTC',
            minimumFractionDigits: 2,
            maximumFractionDigits: 12
        }).format(n);

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(date));
    };

    const sortData = (items) => {
        const sorted = [...items];

        sorted.sort((a, b) => {
            const key = sortConfig.key;
            const dir = sortConfig.direction === "asc" ? 1 : -1;

            // tri texte
            if (typeof a[key] === "string") {
                return a[key].localeCompare(b[key]) * dir;
            }

            // tri numérique
            return ((a[key] || 0) - (b[key] || 0)) * dir;
        });

        return sorted;
    };


    const sortDataEnBtc = (items) => {
        const sortedEnBtc = [...items];

        sortedEnBtc.sort((a, b) => {
            const key = sortConfigEnBtc.key;
            const dir = sortConfigEnBtc.direction === "asc" ? 1 : -1;

            // tri texte
            if (typeof a[key] === "string") {
                return a[key].localeCompare(b[key]) * dir;
            }

            // tri numérique
            return ((a[key] || 0) - (b[key] || 0)) * dir;
        });

        return sortedEnBtc;
    };

    const requestSort = (key) => {
        let direction = "asc";

        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }

        setSortConfig({ key, direction });
    };

    const requestSortEnBtc = (key) => {
        let direction = "asc";

        if (sortConfigEnBtc.key === key && sortConfigEnBtc.direction === "asc") {
            direction = "desc";
        }

        setSortConfigEnBtc({ key, direction });
    };

    const filteredDetail = coinsDetail.filter(item =>
        !normalizedSearch ||
        item.symbol.toLowerCase().includes(normalizedSearch) ||
        (item.stockage && item.stockage.toLowerCase().includes(normalizedSearch))
    );

    const filteredDetailEnBtc = coinsDetailEnBtc.filter(item =>
        !normalizedSearch ||
        item.symbol.toLowerCase().includes(normalizedSearch) ||
        (item.stockage && item.stockage.toLowerCase().includes(normalizedSearch))
    );

    const sortedDetail = sortData(filteredDetail);
    const sortedDetailEnBtc = sortDataEnBtc(filteredDetailEnBtc);

    const createDetailAchat = async () => {
        await axios.post(`${process.env.REACT_APP_API_URL}/backend/coin/detail`, form);
        setForm({ symbol: "", dateAchat: "", stockage: "", nombre: "", prixAchat: "", observation: "" });
        fetchAchatCoins();
    };

    const updateDetailAchat = async (id, field, value) => {
        await axios.put(`${process.env.REACT_APP_API_URL}/backend/coin/detail/${id}`, {
            [field]: value
        });
        fetchAchatCoins();
    };

    const deleteDetailAchat = async (id) => {
        await axios.delete(`${process.env.REACT_APP_API_URL}/backend/coin/detail/${id}`);
        fetchAchatCoins();
    };

    const createDetailAchatEnBtc = async () => {
        await axios.post(`${process.env.REACT_APP_API_URL}/backend/coin/detailEnBtc`, formEnBtc);
        setFormEnBtc({ symbol: "", dateAchat: "", stockage: "", nombre: "", prixAchat: "", observation: "" });
        fetchAchatCoinsEnBtc();
    };

    const updateDetailAchatEnBtc = async (id, field, value) => {
        await axios.put(`${process.env.REACT_APP_API_URL}/backend/coin/detailEnBtc/${id}`, {
            [field]: value
        });
        fetchAchatCoinsEnBtc();
    };

    const deleteDetailAchatEnBtc = async (id) => {
        await axios.delete(`${process.env.REACT_APP_API_URL}/backend/coin/detailEnBtc/${id}`);
        fetchAchatCoinsEnBtc();
    };

    const ownedEnriched = owned.map(c => {
        const prixDuJour = Number(c.prixHistory);
        const dominanceCoin = dominanceCalculee > 0 && c.capitalisation
            ? (c.capitalisation / dominanceCalculee) * 1000000
            : 0;

        const hodl = prixDuJour > 0
            ? ((estimationWallet * dominanceCoin) / prixDuJour) / 1000000
            : 0;

        const nombre = Number(c.nombre) || 0;
        const valeurAchat = nombre * (Number(c.prixCoin) || 0);
        const valeur = nombre * prixDuJour;
        const gainPerte = valeur - valeurAchat;
        const pourcGP = valeurAchat > 0 ? (gainPerte / valeurAchat) * 100 : 0;

        const investMin = (c.evolution > 0 && c.evolution >= btcEvolution) ? hodl * prixDuJour : 0;
        const ecart = valeur - investMin;

        const venteI = pourcGP > gainMin && ecart > (stablePriceToday * 10) ? "oui" : "non";

        return {
            ...c,
            prixDuJour,
            nombre,
            valeurAchat,
            valeur,
            gainPerte,
            pourcGP,
            ecart,
            venteI
        };
    });

    const ownedEnrichedEnBtc = ownedEnBtc.map(c => {
        const prixDuJour = Number(c.prixHistory);
        const prixEnBtc = prixDuJour / btcPriceToday;
        const dominanceCoin = dominanceCalculee > 0 && c.capitalisation
            ? (c.capitalisation / dominanceCalculee) * 1000000
            : 0;

        const hodl = prixDuJour > 0
            ? ((estimationWallet * dominanceCoin) / prixDuJour) / 1000000
            : 0;

        const nombre = Number(c.nombre) || 0;
        const valeurAchat = nombre * (Number(c.prixCoin) || 0);
        const valeur = nombre * prixEnBtc;
        const gainPerte = valeur - valeurAchat;
        const pourcGP = valeurAchat > 0 ? (gainPerte / valeurAchat) * 100 : 0;
        const investMin = (c.evolution > 0 && c.evolution >= btcEvolution) ? hodl * prixDuJour : 0;
        const ecart = valeur - investMin;
        const venteI = pourcGP > gainMin ? "oui" : "non";

        return {
            ...c,
            prixDuJour,
            nombre,
            valeurAchat,
            valeur,
            gainPerte,
            pourcGP,
            ecart,
            venteI
        };
    });

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return "↕"; // neutre
        return sortConfig.direction === "asc" ? "▲" : "▼";
    };

    const getSortIconEnBtc = (key) => {
        if (sortConfigEnBtc.key !== key) return "↕"; // neutre
        return sortConfigEnBtc.direction === "asc" ? "▲" : "▼";
    };

    const handleEurChange = (e) => {
        const eur = parseFloat(e.target.value) || 0;
        setEurValue(eur);

        // EUR → STABLE
        setStableValue(eur / stablePriceToday);

        // EUR → BTC
        setBtcValue(eur / btcPriceToday);
    };

    const handleStableChange = (e) => {
        const stable = parseFloat(e.target.value) || 0;
        setStableValue(stable);

        // STABLE → EUR
        const eur = stable * stablePriceToday;
        setEurValue(eur);

        // STABLE → BTC
        setBtcValue(eur / btcPriceToday);
    };

    const handleBtcChange = (e) => {
        const btc = parseFloat(e.target.value) || 0;
        setBtcValue(btc);

        // BTC → EUR
        const eur = btc * btcPriceToday;
        setEurValue(eur);

        // BTC → STABLE
        setStableValue(eur / stablePriceToday);
    };

    const handleEditChange = (id, field, value) => {
        setEditBuffer(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const handleSaveRow = (item) => {
        const buffer = editBuffer[item._id] || {};

        // on prend la valeur du buffer si présente, sinon la valeur originale
        const payload = {
            symbol: buffer.symbol ?? item.symbol ?? "",
            dateAchat: buffer.dateAchat ?? (item.dateAchat ? item.dateAchat.slice(0, 10) : ""),
            stockage: buffer.stockage ?? item.stockage ?? "",
            nombre: buffer.nombre ?? item.nombre ?? "",
            prixAchat: buffer.prixAchat ?? item.prixAchat ?? "",
            observation: buffer.observation ?? item.observation ?? "",
        };

        // si ton updateDetailAchat est de la forme (id, field, value)
        Object.entries(payload).forEach(([field, value]) => {
            updateDetailAchat(item._id, field, value);
        });

        // optionnel : vider le buffer de cette ligne
        setEditBuffer(prev => {
            const copy = { ...prev };
            delete copy[item._id];
            return copy;
        });
    };

    const handleEditChangeEnBtc = (id, field, value) => {
        setEditBufferBtc(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const handleSaveRowEnBtc = (item) => {
        const bufferBtc = editBufferBtc[item._id] || {};

        // on prend la valeur du buffer si présente, sinon la valeur originale
        const payload = {
            symbol: bufferBtc.symbol ?? item.symbol ?? "",
            dateAchat: bufferBtc.dateAchat ?? (item.dateAchat ? item.dateAchat.slice(0, 10) : ""),
            stockage: bufferBtc.stockage ?? item.stockage ?? "",
            nombre: bufferBtc.nombre ?? item.nombre ?? "",
            prixAchat: bufferBtc.prixAchat ?? item.prixAchat ?? "",
            observation: bufferBtc.observation ?? item.observation ?? "",
        };

        // si ton updateDetailAchat est de la forme (id, field, value)
        Object.entries(payload).forEach(([field, value]) => {
            updateDetailAchatEnBtc(item._id, field, value);
        });

        // optionnel : vider le buffer de cette ligne
        setEditBufferBtc(prev => {
            const copy = { ...prev };
            delete copy[item._id];
            return copy;
        });
    };

    useEffect(() => {
        fetchDominance();
        fetchCoins();
        fetchCoinsEnBtc();
        fetchStats();
        fetchMaxDiff();
        fetchAchatCoins();
        fetchAchatCoinsEnBtc();
    }, []);

    useEffect(() => {
        fetchNote();
    }, []);

    useEffect(() => {
        if (mode === "eur") {
            setActiveTab("groupe");
        } else if (mode === "btc") {
            setActiveTab("groupeB");
        }
    }, [mode]);



    return (
        <div>
            <div className="d-flex">
                <h1>Wallet</h1>

                <button
                    className={`btn btn-sm btn-currency mb-4 ${mode === "eur" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setMode("eur")}
                >
                    <img src="/img/eur.png" style={{ width: 28 }} alt="eur" />
                </button>

                <button
                    className={`btn btn-sm btn-currency mb-4 ${mode === "btc" ? "btn-warning" : "btn-outline-warning"}`}
                    onClick={() => setMode("btc")}
                >
                    <img src="/img/btc.png" style={{ width: 28 }} alt="btc" />
                </button>
            </div>

            <div className="row mb-3">
                <div className="col-md-3">
                    <div className="card p-3 shadow-sm">
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <h5>Algorithme</h5>
                                <p className="mb-0">
                                    <small className="text-muted">Date Cible</small><br />
                                    <strong>{dateCible || "N/A"}</strong>
                                </p>
                            </div>

                            <div className="mb-1">
                                <small className="text-muted">Diff maximale</small><br />
                                {maxDiff ? (
                                    <>
                                        <h3 className="text-primary"><strong>{maxDiff.diff} jours</strong></h3><br />
                                        <small>
                                            Début : {formatDate(maxDiff.dateCours)}
                                            <br />
                                            Fin : {formatDate(maxDiff.dateDepassement)}
                                        </small>
                                    </>
                                ) : (
                                    "Chargement..."
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-2">
                    <div className="card p-3 shadow-sm">

                        <h6 className="mt-2">Convertisseur</h6>

                        {/* EUR */}
                        <div className="mb-2">
                            <small className="text-muted">Somme en Euros</small>
                            <input
                                type="number"
                                className="form-control"
                                value={eurValue}
                                onChange={handleEurChange}
                                placeholder="EUR → Stable / BTC"
                            />
                        </div>

                        {/* STABLE */}
                        <div className="mb-2">
                            <small className="text-muted">Somme en Stable</small>
                            <input
                                type="number"
                                className="form-control"
                                value={stableValue}
                                onChange={handleStableChange}
                                placeholder="Stable → EUR / BTC"
                            />
                        </div>

                        {/* BTC */}
                        <div className="mb-2">
                            <small className="text-muted">Somme en BTC</small>
                            <input
                                type="number"
                                className="form-control"
                                value={btcValue}
                                onChange={handleBtcChange}
                                placeholder="BTC → EUR / Stable"
                            />
                        </div>

                    </div>
                </div>

                <div className="col-md-2">
                    <div className="card p-3 shadow-sm">
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <h5>Informations</h5>
                                <div className="mb-1">
                                    <small className="text-muted">Dernière mise à jour</small><br />
                                    <strong>{formatDate(stats.lastUpdate)}</strong>
                                </div>
                                <div className="mb-1">
                                    <small className="text-muted">Prix Stable</small><br />
                                    <strong>{formatCurrency2(stablePriceToday)}</strong>
                                </div>
                            </div>

                            <div className="mb-1">
                                <small className="text-muted">Coins</small><br />
                                {maxDiff ? (
                                    <h3 className="text-primary"><strong>{stats.coinsCount}</strong></h3>
                                ) : (
                                    "Chargement..."
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card p-3 shadow-sm">
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <h5>Investissement</h5>

                                <div className="mb-1">
                                    <small className="text-muted">Investit</small><br />
                                    <strong>{formatCurrency0(investissement)}</strong>
                                </div>

                                <div className="mb-1">
                                    <small className="text-muted">Gain</small><br />
                                    <strong>{gainPourcentage.toFixed(0)}%</strong>
                                </div>
                            </div>

                            <div className="mb-0">
                                <small className="text-muted">Portefeuille</small><br />
                                <h3 className="text-primary">
                                    <strong>{formatCurrency0(totalValeur)}</strong>
                                </h3>
                                <div className="mb-1">
                                    <small className="text-muted">Estimation Wallet</small><br />
                                    <strong>{formatCurrency0(estimationWallet)}</strong>
                                </div>

                                <div className="mb-1">
                                    <small className="text-muted">Différence</small><br />
                                    <strong className={difference >= 0 ? "text-success" : "text-danger"}>
                                        {(difference * 100).toFixed(1)}%
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-2">
                    <div className="card p-3 shadow-sm">
                        <div >
                            <div className="d-flex justify-content-between align-items-start">
                                <h5>Notes</h5>
                                <button className="btn btn-light mt-2" onClick={saveNote}>💾</button>
                            </div>
                            <div>
                                <textarea
                                    className="form-control"
                                    rows="4"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ul className="nav nav-tabs mb-3">
                {mode === "eur" && (
                    <>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === "groupe" ? "active" : ""}`}
                                onClick={() => setActiveTab("groupe")}
                            >
                                Groupé
                            </button>
                        </li>

                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === "detail" ? "active" : ""}`}
                                onClick={() => setActiveTab("detail")}
                            >
                                Détail
                            </button>
                        </li>
                    </>
                )}
                {mode === "btc" && (
                    <>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === "groupeB" ? "active" : ""}`}
                                onClick={() => setActiveTab("groupeB")}
                            >
                                Groupé Bitcoin
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === "detailB" ? "active" : ""}`}
                                onClick={() => setActiveTab("detailB")}
                            >
                                Détail Bitcoin
                            </button>
                        </li>
                    </>
                )}
            </ul>

            <div className="card p-3 shadow-sm">

                {mode === "eur" && activeTab === "groupe" && (
                    <>
                        {loading ? (
                            <div>Chargement...</div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-sm">
                                    <thead>
                                        <tr>
                                            <th></th>

                                            <th className="text-center" onClick={() => requestSort("symbol")} style={{ cursor: "pointer" }}>
                                                Symbole {getSortIcon("symbol")}
                                            </th>

                                            <th className="text-center" onClick={() => requestSort("name")} style={{ cursor: "pointer" }}>
                                                Nom {getSortIcon("name")}
                                            </th>

                                            <th className="text-center" onClick={() => requestSort("nombre")} style={{ cursor: "pointer" }}>
                                                Nombre {getSortIcon("nombre")}
                                            </th>

                                            <th className="text-center" onClick={() => requestSort("valeurAchat")} style={{ cursor: "pointer" }}>
                                                Valeur d'Achat {getSortIcon("valeurAchat")}
                                            </th>

                                            <th className="text-center">
                                                Prix Achat Moyen
                                            </th>

                                            <th className="text-center" onClick={() => requestSort("valeur")} style={{ cursor: "pointer" }}>
                                                Valeur {getSortIcon("valeur")}
                                            </th>

                                            <th className="text-center">
                                                Gain/Perte
                                            </th>

                                            <th className="text-center">
                                                %
                                            </th>

                                            <th className="text-center">
                                                Evol. Cible
                                            </th>

                                            <th className="text-center">
                                                Ecart
                                            </th>

                                            <th className="text-center" onClick={() => requestSort("venteI")} style={{ cursor: "pointer" }}>
                                                Vente ? {getSortIcon("venteI")}
                                            </th>

                                            <th className="text-center" onClick={() => requestSort("dateVerif")} style={{ cursor: "pointer" }}>
                                                Date de vérification {getSortIcon("dateVerif")}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortData(ownedEnriched)
                                            .map((c) => {

                                                return (
                                                    <tr
                                                        key={c.symbol}
                                                        className={
                                                            c.symbol === "btc"
                                                                ? "table-warning"
                                                                :
                                                                c.evolution > 0
                                                                    ? "table-success"
                                                                    : "table-danger"
                                                        }>
                                                        <td className="text-center">
                                                            <img
                                                                src={`/img/coins/${c.symbol}.png`}
                                                                alt={c.symbol}
                                                                style={{ width: 32, height: 32 }}
                                                                onError={(e) => { e.target.src = '/img/random-coin.jpg'; }}
                                                            />
                                                        </td>
                                                        <td className="text-center">{c.symbol}</td>
                                                        <td className="text-center">{c.name}</td>
                                                        <td className="text-center">{formatNumber8(c.nombre)}</td>
                                                        <td className="text-center">{formatCurrency0(c.valeurAchat)}</td>
                                                        <td className="text-center">{formatCurrency12(c.prixCoin)}</td>
                                                        <td className="text-center">{formatCurrency0(c.valeur)}</td>
                                                        <td className="text-center">{formatCurrency2(c.gainPerte)}</td>
                                                        <td className="text-center">{formatNumber2(c.pourcGP)} %</td>
                                                        <td className="text-center">{formatNumber2(c.evolution)} %</td>
                                                        <td className="text-center">{formatCurrency0(c.ecart)}</td>
                                                        <td
                                                            className={`text-center ${c.venteI === "oui" ? "bg-success text-white" : "bg-danger text-white"
                                                                }`}
                                                        >
                                                            {c.venteI}
                                                        </td>
                                                        <td className="text-center">{formatDate(c.dateVerif)}</td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <th></th>
                                            <th></th>
                                            <th className="text-center">Total</th>
                                            <th className="text-center">{formatNumber0(totalNombre)}</th>
                                            <th className="text-center">{formatCurrency0(totalValeurAchat)}</th>
                                            <th></th>
                                            <th className="text-center">{formatCurrency0(totalValeur)}</th>
                                            <th className="text-center">{formatNumber2(totalGainPerte)}</th>
                                            <th className="text-center">{formatNumber2(totalPourcGP)} %</th>
                                        </tr>
                                    </tfoot>
                                </table>
                                {owned.length === 0 && <div className="text-muted">Aucune crypto possédée (nombre &gt; 0).</div>}
                            </div>
                        )}
                    </>
                )}

                {mode === "eur" && activeTab === "detail" && (
                    <>
                        {/* CREATE */}
                        <div className="card p-3 mb-4">
                            <h4>Ajouter un achat</h4>
                            <div className="row g-2">
                                <div className="col">
                                    <input
                                        className="form-control"
                                        placeholder="symbole"
                                        value={form.symbol}
                                        onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                                    />
                                </div>
                                <div className="col">
                                    <input
                                        type="date"
                                        className="form-control"
                                        placeholder="date d'achat"
                                        value={form.dateAchat}
                                        onChange={(e) => setForm({ ...form, dateAchat: e.target.value })}
                                    />
                                </div>
                                <div className="col">
                                    <input
                                        className="form-control"
                                        placeholder="stockage"
                                        value={form.stockage}
                                        onChange={(e) => setForm({ ...form, stockage: e.target.value })}
                                    />
                                </div>
                                <div className="col">
                                    <input
                                        className="form-control"
                                        placeholder="nombre"
                                        value={form.nombre}
                                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                    />
                                </div>
                                <div className="col">
                                    <input
                                        className="form-control"
                                        placeholder="prix d'achat"
                                        value={form.prixAchat}
                                        onChange={(e) => setForm({ ...form, prixAchat: e.target.value })}
                                    />
                                </div>
                                <div className="col">
                                    <input
                                        className="form-control"
                                        placeholder="observation"
                                        value={form.observation}
                                        onChange={(e) => setForm({ ...form, observation: e.target.value })}
                                    />
                                </div>
                                <div className="col-auto">
                                    <button className="btn btn-primary" onClick={createDetailAchat}>
                                        Ajouter
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* LIST + UPDATE + DELETE */}
                        {loading ? (
                            <div>Chargement...</div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-sm">
                                    <thead>
                                        <tr>
                                            <th onClick={() => requestSort("symbol")} style={{ cursor: "pointer" }}>
                                                Coin
                                            </th>

                                            <th onClick={() => requestSort("dateAchat")} style={{ cursor: "pointer" }}>
                                                Date Achat
                                            </th>

                                            <th onClick={() => requestSort("stockage")} style={{ cursor: "pointer" }}>
                                                Stockage
                                            </th>

                                            <th onClick={() => requestSort("nombre")} style={{ cursor: "pointer" }}>
                                                Nombre
                                            </th>

                                            <th onClick={() => requestSort("prixAchat")} style={{ cursor: "pointer" }}>
                                                Prix Achat
                                            </th>

                                            <th onClick={() => requestSort("observation")} style={{ cursor: "pointer" }}>
                                                Observation
                                            </th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedDetail.map((item, index) => {
                                            const buffer = editBuffer[item._id] || {};

                                            const symbol = buffer.symbol ?? item.symbol ?? "";
                                            const dateAchat = buffer.dateAchat ?? (item.dateAchat ? item.dateAchat.slice(0, 10) : "");
                                            const stockage = buffer.stockage ?? item.stockage ?? "";
                                            const nombre = buffer.nombre ?? item.nombre ?? "";
                                            const prixAchat = buffer.prixAchat ?? item.prixAchat ?? "";
                                            const observation = buffer.observation ?? item.observation ?? "";

                                            return (
                                                <tr key={index}>
                                                    <td>
                                                        <input
                                                            className="form-control"
                                                            value={symbol}
                                                            onChange={(e) => handleEditChange(item._id, "symbol", e.target.value)}
                                                        />
                                                    </td>

                                                    <td>
                                                        <input
                                                            type="date"
                                                            className="form-control"
                                                            value={dateAchat}
                                                            onChange={(e) => handleEditChange(item._id, "dateAchat", e.target.value)}
                                                        />
                                                    </td>

                                                    <td>
                                                        <input
                                                            className="form-control"
                                                            value={stockage}
                                                            onChange={(e) => handleEditChange(item._id, "stockage", e.target.value)}
                                                        />
                                                    </td>

                                                    <td>
                                                        <input
                                                            className="form-control"
                                                            value={nombre}
                                                            onChange={(e) => handleEditChange(item._id, "nombre", e.target.value)}
                                                        />
                                                    </td>

                                                    <td>
                                                        <input
                                                            className="form-control"
                                                            value={prixAchat}
                                                            onChange={(e) => handleEditChange(item._id, "prixAchat", e.target.value)}
                                                        />
                                                    </td>

                                                    <td>
                                                        <textarea
                                                            className="form-control"
                                                            rows={3}
                                                            value={observation}
                                                            onChange={(e) => handleEditChange(item._id, "observation", e.target.value)}
                                                        />
                                                    </td>

                                                    <td className="text-center">
                                                        <button
                                                            className="btn btn-light mt-2 ml-1"
                                                            onClick={() => handleSaveRow(item)}
                                                            title="Sauvegarder"
                                                        >
                                                            💾
                                                        </button>

                                                        <button
                                                            className="btn btn-light mt-2 ml-1"
                                                            onClick={() => deleteDetailAchat(item._id)}
                                                            title="Supprimer"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <th></th>
                                            <th></th>
                                            <th className="text-center">Total</th>

                                            <th className="ps-3">{formatNumber0(totalNombre)}</th>
                                            <th className="ps-3">{formatCurrency0(totalValeurAchat)}</th>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {mode === "btc" && activeTab === "groupeB" && (
                    <>
                        {loading ? (
                            <div>Chargement...</div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-sm">
                                    <thead>
                                        <tr>
                                            <th></th>

                                            <th className="text-center" onClick={() => requestSortEnBtc("symbol")} style={{ cursor: "pointer" }}>
                                                Symbole {getSortIconEnBtc("symbol")}
                                            </th>

                                            <th className="text-center" onClick={() => requestSortEnBtc("name")} style={{ cursor: "pointer" }}>
                                                Nom {getSortIconEnBtc("name")}
                                            </th>

                                            <th className="text-center" onClick={() => requestSortEnBtc("nombre")} style={{ cursor: "pointer" }}>
                                                Nombre {getSortIconEnBtc("nombre")}
                                            </th>

                                            <th className="text-center" onClick={() => requestSortEnBtc("valeurAchat")} style={{ cursor: "pointer" }}>
                                                Valeur d'Achat {getSortIconEnBtc("valeurAchat")}
                                            </th>

                                            <th className="text-center">
                                                Prix Achat Moyen
                                            </th>

                                            <th className="text-center" onClick={() => requestSortEnBtc("valeur")} style={{ cursor: "pointer" }}>
                                                Valeur {getSortIconEnBtc("valeur")}
                                            </th>

                                            <th className="text-center">
                                                Gain/Perte
                                            </th>

                                            <th className="text-center">
                                                %
                                            </th>

                                            <th className="text-center" onClick={() => requestSortEnBtc("venteI")} style={{ cursor: "pointer" }}>
                                                Vente ? {getSortIconEnBtc("venteI")}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortDataEnBtc(ownedEnrichedEnBtc)
                                            .map((c) => {

                                                return (
                                                    <tr
                                                        key={c.symbol}
                                                        className={
                                                            c.venteI === "oui"
                                                                ? "table-success"
                                                                : "table-danger"
                                                        }>
                                                        <td className="text-center">
                                                            <img
                                                                src={`/img/coins/${c.symbol}.png`}
                                                                alt={c.symbol}
                                                                style={{ width: 32, height: 32 }}
                                                                onError={(e) => { e.target.src = '/img/random-coin.jpg'; }}
                                                            />
                                                        </td>
                                                        <td className="text-center">{c.symbol}</td>
                                                        <td className="text-center">{c.name}</td>
                                                        <td className="text-center">{formatNumber8(c.nombre)}</td>
                                                        <td className="text-center">{formatCurrency12B(c.valeurAchat)}</td>
                                                        <td className="text-center">{formatCurrency12B(c.prixCoin)}</td>
                                                        <td className="text-center">{formatCurrency12B(c.valeur)}</td>
                                                        <td className="text-center">{formatCurrency12B(c.gainPerte)}</td>
                                                        <td className="text-center">{formatNumber2(c.pourcGP)} %</td>
                                                        <td className="text-center">{c.venteI}</td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                                {owned.length === 0 && <div className="text-muted">Aucune crypto possédée (nombre &gt; 0).</div>}
                            </div>
                        )}
                    </>
                )}

                {mode === "btc" && activeTab === "detailB" && (
                    <>

                        {/* CREATE */}
                        <div className="card p-3 mb-4">
                            <h4>Ajouter un achat</h4>
                            <div className="row g-2">
                                <div className="col">
                                    <input
                                        className="form-control"
                                        placeholder="symbole"
                                        value={formEnBtc.symbol}
                                        onChange={(e) => setFormEnBtc({ ...formEnBtc, symbol: e.target.value })}
                                    />
                                </div>
                                <div className="col">
                                    <input
                                        type="date"
                                        className="form-control"
                                        placeholder="date d'achat"
                                        value={formEnBtc.dateAchat}
                                        onChange={(e) => setFormEnBtc({ ...formEnBtc, dateAchat: e.target.value })}
                                    />
                                </div>
                                <div className="col">
                                    <input
                                        className="form-control"
                                        placeholder="stockage"
                                        value={formEnBtc.stockage}
                                        onChange={(e) => setFormEnBtc({ ...formEnBtc, stockage: e.target.value })}
                                    />
                                </div>
                                <div className="col">
                                    <input
                                        className="form-control"
                                        placeholder="nombre"
                                        value={formEnBtc.nombre}
                                        onChange={(e) => setFormEnBtc({ ...formEnBtc, nombre: e.target.value })}
                                    />
                                </div>
                                <div className="col">
                                    <input
                                        className="form-control"
                                        placeholder="prix d'achat"
                                        value={formEnBtc.prixAchat}
                                        onChange={(e) => setFormEnBtc({ ...formEnBtc, prixAchat: e.target.value })}
                                    />
                                </div>
                                <div className="col">
                                    <input
                                        className="form-control"
                                        placeholder="observation"
                                        value={formEnBtc.observation}
                                        onChange={(e) => setFormEnBtc({ ...formEnBtc, observation: e.target.value })}
                                    />
                                </div>
                                <div className="col-auto">
                                    <button className="btn btn-primary" onClick={createDetailAchatEnBtc}>
                                        Ajouter
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* LIST + UPDATE + DELETE */}
                        {loading ? (
                            <div>Chargement...</div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-sm">
                                    <thead>
                                        <tr>
                                            <th onClick={() => requestSortEnBtc("symbol")} style={{ cursor: "pointer" }}>
                                                Coin
                                            </th>

                                            <th onClick={() => requestSortEnBtc("dateAchat")} style={{ cursor: "pointer" }}>
                                                Date Achat
                                            </th>

                                            <th onClick={() => requestSortEnBtc("stockage")} style={{ cursor: "pointer" }}>
                                                Stockage
                                            </th>

                                            <th onClick={() => requestSortEnBtc("nombre")} style={{ cursor: "pointer" }}>
                                                Nombre
                                            </th>

                                            <th onClick={() => requestSortEnBtc("prixAchat")} style={{ cursor: "pointer" }}>
                                                Prix Achat
                                            </th>

                                            <th onClick={() => requestSortEnBtc("observation")} style={{ cursor: "pointer" }}>
                                                Observation
                                            </th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedDetailEnBtc.map((item, index) => {
                                            const bufferBtc = editBufferBtc[item._id] || {};

                                            const symbol = bufferBtc.symbol ?? item.symbol ?? "";
                                            const dateAchat = bufferBtc.dateAchat ?? (item.dateAchat ? item.dateAchat.slice(0, 10) : "");
                                            const stockage = bufferBtc.stockage ?? item.stockage ?? "";
                                            const nombre = bufferBtc.nombre ?? item.nombre ?? "";
                                            const prixAchat = bufferBtc.prixAchat ?? item.prixAchat ?? "";
                                            const observation = bufferBtc.observation ?? item.observation ?? "";

                                            return (
                                                <tr key={index}>
                                                    <td>
                                                        <input
                                                            className="form-control"
                                                            value={symbol}
                                                            onChange={(e) => handleEditChangeEnBtc(item._id, "symbol", e.target.value)}
                                                        />
                                                    </td>

                                                    <td>
                                                        <input
                                                            type="date"
                                                            className="form-control"
                                                            value={dateAchat}
                                                            onChange={(e) => handleEditChangeEnBtc(item._id, "dateAchat", e.target.value)}
                                                        />
                                                    </td>

                                                    <td>
                                                        <input
                                                            className="form-control"
                                                            value={stockage}
                                                            onChange={(e) => handleEditChangeEnBtc(item._id, "stockage", e.target.value)}
                                                        />
                                                    </td>

                                                    <td>
                                                        <input
                                                            className="form-control"
                                                            value={nombre}
                                                            onChange={(e) => handleEditChangeEnBtc(item._id, "nombre", e.target.value)}
                                                        />
                                                    </td>

                                                    <td>
                                                        <input
                                                            className="form-control"
                                                            value={prixAchat}
                                                            onChange={(e) => handleEditChangeEnBtc(item._id, "prixAchat", e.target.value)}
                                                        />
                                                    </td>

                                                    <td>
                                                        <textarea
                                                            className="form-control"
                                                            rows={3}
                                                            value={observation}
                                                            onChange={(e) => handleEditChangeEnBtc(item._id, "observation", e.target.value)}
                                                        />
                                                    </td>

                                                    <td className="text-center">
                                                        <button
                                                            className="btn btn-light mt-2 mr-1"
                                                            onClick={() => handleSaveRowEnBtc(item)}
                                                            title="Sauvegarder"
                                                        >
                                                            💾
                                                        </button>

                                                        <button
                                                            className="btn btn-light mt-2 ml-1"
                                                            onClick={() => deleteDetailAchatEnBtc(item._id)}
                                                            title="Supprimer"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </td>
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
        </div >
    );
};

export default Wallet;