import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Coins = ({ search = '' }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateProjection, setDateProjection] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/backend/history/synthese`);

            setDateProjection(res.data.dateProjection);

            setData(
                [...res.data.data].sort((a, b) => a.symbol.localeCompare(b.symbol))
            );

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    const normalizedSearch = (search || '').trim().toLowerCase();

    const filteredData = data.filter(c =>
        !normalizedSearch ||
        c.symbol.toLowerCase().includes(normalizedSearch) ||
        c.name.toLowerCase().includes(normalizedSearch)
    );

    const formatNumber = (v) =>
        v === null || v === undefined ? "-" : v.toLocaleString("fr-FR", { maximumFractionDigits: 4 });

    const formatDate = (d) =>
        d ? new Date(d).toLocaleDateString("fr-FR") : "-";

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Synthèse</h1>
            </div>

            <div className="card p-4">
                {loading ? (
                    <p>Chargement...</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-striped table-hover">
                            <thead className="table-dark">
                                <tr>
                                    <th>Symbole</th>
                                    <th>Nom</th>
                                    <th>Aujourd'hui</th>
                                    <th>Hier</th>
                                    <th>{formatDate(dateProjection)}</th>
                                    <th>Évolution (%)</th>
                                    <th>Maximum</th>
                                    <th>Minimum</th>
                                    <th>Fib. Vente</th>
                                    <th>Fib. Achat</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((coin, i) => (
                                    <tr key={i}>
                                        <td><strong>{coin.symbol}</strong></td>
                                        <td>{coin.name}</td>
                                        <td>{formatNumber(coin.prixAuj)}</td>
                                        <td>{formatNumber(coin.prixHier)}</td>
                                        <td>{formatNumber(coin.prixProjection)}</td>
                                        <td>
                                            {coin.evolution !== null ? formatNumber(coin.evolution) + " %" : "-"}
                                        </td>
                                        <td>
                                            {coin.max ? (
                                                <>
                                                    {formatNumber(coin.max.prix)}<br />
                                                    <small>{formatDate(coin.max.date)}</small>
                                                </>
                                            ) : "-"}
                                        </td>
                                        <td>
                                            {coin.min ? (
                                                <>
                                                    {formatNumber(coin.min.prix)}<br />
                                                    <small>{formatDate(coin.min.date)}</small>
                                                </>
                                            ) : "-"}
                                        </td>
                                        <td>{formatNumber(coin.fibVente)}</td>
                                        <td>{formatNumber(coin.fibAchat)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Coins;
