import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Achats = ({ search = '' }) => {

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/backend/history/achats`);
            setData(
                [...res.data].sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0))
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

    const formatNumber6 = (value) => {
        if (value === null || value === undefined) return "-";
        return value.toLocaleString("fr-FR", { maximumFractionDigits: 6 });
    };

    const formatNumber0 = (value) => {
        if (value === null || value === undefined) return "-";
        return value.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Achats</h1>
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
                                    <th>Portefeuille</th>
                                    <th>Prix Aujourd'hui</th>
                                    <th>Prix Hier</th>
                                    <th>Évolution %</th>
                                    <th>Market Cap</th>
                                    <th>Volume</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((coin, index) => (
                                    <tr key={index}>
                                        <td><strong>{coin.symbol}</strong></td>
                                        <td>{coin.name}</td>
                                        <td>{coin.nombre}</td>
                                        <td>{formatNumber6(coin.prixAuj)}</td>
                                        <td>{formatNumber6(coin.prixHier)}</td>
                                        <td>
                                            {coin.evolution === null
                                                ? "-"
                                                : `${formatNumber0(coin.evolution)} %`}
                                        </td>
                                        <td>{formatNumber0(coin.market_cap)}</td>
                                        <td>{formatNumber0(coin.total_volume)}</td>
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

export default Achats;
