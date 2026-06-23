import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Coins = ({ search = '' }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateCible, setDateCible] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/backend/history/synthese`);

            setDateCible(res.data.dateCible);

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

    const formatCurrency12 = (n) =>
        new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 12
        }).format(n);

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
                                    <th></th>
                                    <th className="text-center">Symbol</th>
                                    <th className="text-center">Nom</th>
                                    <th className="text-center">Prix Aujourd'hui</th>
                                    <th className="text-center">Prix Hier</th>
                                    <th className="text-center">{formatDate(dateCible)}</th>
                                    <th className="text-center">Évolution (%)</th>
                                    <th className="text-center">Prix Max</th>
                                    <th className="text-center">Prix Min</th>
                                    <th className="text-center">Fib. Vente</th>
                                    <th className="text-center">Fib. Achat</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((coin, i) => (
                                    <tr key={i}>
                                        <td className="text-center">
                                            <img
                                                src={`/img/coins/${coin.symbol}.png`}
                                                alt={coin.symbol}
                                                style={{ width: 32, height: 32 }}
                                                onError={(e) => { e.target.src = '/img/random-coin.jpg'; }}
                                            />
                                        </td>
                                        <td className="text-center"><strong>{coin.symbol}</strong></td>
                                        <td className="text-center">{coin.name}</td>
                                        <td className="text-center">{formatCurrency12(coin.prixAuj)}</td>
                                        <td className="text-center">{formatCurrency12(coin.prixHier)}</td>
                                        <td className="text-center">{formatCurrency12(coin.prixCible)}</td>
                                        <td className="text-center">
                                            {coin.evolution !== null ? formatNumber(coin.evolution) + " %" : "-"}
                                        </td>
                                        <td className="text-center">
                                            {coin.max ? (
                                                <>
                                                    {formatCurrency12(coin.max.prix)}<br />
                                                    <small>{formatDate(coin.max.date)}</small>
                                                </>
                                            ) : "-"}
                                        </td>
                                        <td className="text-center">
                                            {coin.min ? (
                                                <>
                                                    {formatCurrency12(coin.min.prix)}<br />
                                                    <small>{formatDate(coin.min.date)}</small>
                                                </>
                                            ) : "-"}
                                        </td>
                                        <td className="text-center">{formatCurrency12(coin.fibVente)}</td>
                                        <td className="text-center">{formatCurrency12(coin.fibAchat)}</td>
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
