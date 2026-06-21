import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Wallet = ({ search = '' }) => {
    const [coins, setCoins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ lastUpdate: null, coinsCount: 0 });
    const [sortConfig, setSortConfig] = useState({ key: "valeur", direction: "desc" });
    const [maxDiff, setMaxDiff] = useState(null);
    const [dateProjection, setDateProjection] = useState(null);

    useEffect(() => {
        const fetchCoins = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/backend/coin`);
                setCoins(res.data || []);
                if (res.data?.length > 0) {
                    setDateProjection(res.data[0].dateProjection);
                }

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
                console.log(res.data);
            } catch (err) {
                console.error("Erreur récupération maxDiff", err);
            }
        };

        fetchCoins();
        fetchStats();
        fetchMaxDiff();
    }, []);

    const normalizedSearch = (search || '').trim().toLowerCase();
    const owned = coins
        .filter(c => c.nombre && Number(c.nombre) > 0)
        .filter((c) =>
            !normalizedSearch ||
            c.symbol.toLowerCase().includes(normalizedSearch) ||
            c.name.toLowerCase().includes(normalizedSearch)
        );

    const totalNombre = owned.reduce((sum, c) => sum + (Number(c.nombre) || 0), 0);
    const totalValeur = owned.reduce((sum, c) => sum + ((Number(c.nombre) || 0) * (Number(c.prixHistory) || 0)), 0);
    const investissement = Number(process.env.REACT_APP_INVESTISSEMENT) || 0;
    const gain = totalValeur - investissement;
    const gainPourcentage = investissement > 0 ? (gain / investissement) * 100 : 0;

    const formatNumber = (n) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 8 }).format(n);

    const formatCurrency = (n) =>
        new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(n);

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(date));
    };

    const sortData = (data) => {
        const sorted = [...data];

        sorted.sort((a, b) => {
            const { key, direction } = sortConfig;

            let valA, valB;

            switch (key) {
                case "symbol":
                    valA = a.symbol.toLowerCase();
                    valB = b.symbol.toLowerCase();
                    break;

                case "name":
                    valA = a.name.toLowerCase();
                    valB = b.name.toLowerCase();
                    break;

                case "nombre":
                    valA = Number(a.nombre) || 0;
                    valB = Number(b.nombre) || 0;
                    break;

                case "valeur":
                    valA = (Number(a.nombre) || 0) * (Number(a.prixHistory) || 0);
                    valB = (Number(b.nombre) || 0) * (Number(b.prixHistory) || 0);
                    break;

                case "dateVerif":
                    valA = a.dateVerif ? new Date(a.dateVerif).getTime() : 0;
                    valB = b.dateVerif ? new Date(b.dateVerif).getTime() : 0;
                    break;

                default:
                    return 0;
            }

            if (valA < valB) return direction === "asc" ? -1 : 1;
            if (valA > valB) return direction === "asc" ? 1 : -1;
            return 0;
        });

        return sorted;
    };

    const requestSort = (key) => {
        let direction = "asc";

        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }

        setSortConfig({ key, direction });
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Wallet</h1>
            </div>

            <div className="row mb-4">
                <div className="col-md-4">
                    <div className="card p-3 shadow-sm">
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <h5>Algorithme</h5>
                                <p className="mb-0">
                                    <small className="text-muted">Date Cible</small><br />
                                    <strong>{dateProjection || "N/A"}</strong>
                                </p>
                            </div>

                            <p className="mb-1">
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
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card p-3 shadow-sm">
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <h5>Informations</h5>
                                <p className="mb-1">
                                    <small className="text-muted">Dernière mise à jour</small><br />
                                    <strong>{formatDate(stats.lastUpdate)}</strong>
                                </p>
                            </div>

                            <p className="mb-1">
                                <small className="text-muted">Coins</small><br />
                                {maxDiff ? (
                                    <>
                                        <h3 className="text-primary"><strong>{stats.coinsCount}</strong></h3><br />
                                    </>
                                ) : (
                                    "Chargement..."
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card p-3 shadow-sm">
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <h5>Investissement</h5>
                                <p className="mb-1">
                                    <small className="text-muted">Investit</small><br />
                                    <strong>{formatCurrency(investissement)}</strong>
                                </p>
                                <p className="mb-0">
                                    <small className="text-muted">Portefeuille</small><br />
                                    <strong>{formatCurrency(totalValeur)}</strong>
                                </p>
                            </div>
                            <div>
                                <p className="mb-1">
                                    <small className="text-muted">Gain</small><br />
                                    <h3 className="text-primary"><strong>{gainPourcentage.toFixed(0)}%</strong></h3>
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <div className="card p-3 shadow-sm">
                <h5 className="mb-3">Détails du portefeuille</h5>

                {loading ? (
                    <div>Chargement...</div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-sm">
                            <thead>
                                <tr>
                                    <th></th>

                                    <th onClick={() => requestSort("symbol")} style={{ cursor: "pointer" }}>
                                        Symbole
                                    </th>

                                    <th onClick={() => requestSort("name")} style={{ cursor: "pointer" }}>
                                        Nom
                                    </th>

                                    <th onClick={() => requestSort("nombre")} style={{ cursor: "pointer" }}>
                                        Nombre
                                    </th>

                                    <th onClick={() => requestSort("valeur")} style={{ cursor: "pointer" }}>
                                        Valeur
                                    </th>

                                    <th onClick={() => requestSort("dateVerif")} style={{ cursor: "pointer" }}>
                                        Date de vérification
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortData(owned)
                                    .map((c) => (
                                        <tr key={c.symbol}>
                                            <td>
                                                <img
                                                    src={`/img/coins/${c.symbol}.png`}
                                                    alt={c.symbol}
                                                    style={{ width: 32, height: 32 }}
                                                    onError={(e) => { e.target.src = '/img/random-coin.jpg'; }}
                                                />
                                            </td>
                                            <td>{c.symbol}</td>
                                            <td>{c.name}</td>
                                            <td>{formatNumber(Number(c.nombre) || 0)}</td>
                                            <td>{formatCurrency((Number(c.nombre) || 0) * (Number(c.prixHistory) || 0))}</td>
                                            <td>{formatDate(c.dateVerif)}</td>
                                        </tr>
                                    ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <th></th>
                                    <th colSpan="2">Total</th>
                                    <th>{formatNumber(totalNombre)}</th>
                                    <th>{formatCurrency(totalValeur)}</th>
                                </tr>
                            </tfoot>
                        </table>
                        {owned.length === 0 && <div className="text-muted">Aucune crypto possédée (nombre &gt; 0).</div>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wallet;