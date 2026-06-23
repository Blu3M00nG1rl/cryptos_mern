import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Ventes = ({ search = '' }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/backend/history/ventes`);
            setData(res.data);
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

    const formatNumber = (value) => {
        if (value === null || value === undefined) return "-";
        return value.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
    };

    const formatNumber12 = (value) => {
        if (value === null || value === undefined) return "-";
        return value.toLocaleString("fr-FR", { maximumFractionDigits: 12 });
    };

    const formatCurrency0 = (n) =>
        new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(n);

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Ventes</h1>
            </div>

            <div className="card p-4">
                {loading ? (
                    <p>Chargement...</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-striped table-hover">
                            <thead className="table-dark">
                                <tr>
                                    <th className='text-center'>Symbole</th>
                                    <th className='text-center'>Nom</th>
                                    <th className='text-center'>Portefeuille</th>
                                    <th className='text-center'>Prix Aujourd'hui</th>
                                    <th className='text-center'>Prix Hier</th>
                                    <th className='text-center'>Évolution 24h</th>
                                    <th className='text-center'>Évolution Cible</th>
                                    <th className='text-center'>Market Cap</th>
                                    <th className='text-center'>Volume</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((coin, index) => (
                                    <tr key={index}>
                                        <td className='text-center'><strong>{coin.symbol}</strong></td>
                                        <td className='text-center'>{coin.name}</td>
                                        <td className='text-center'>{formatNumber12(coin.nombre)}</td>
                                        <td className='text-center'>{formatCurrency0(coin.prixAuj)}</td>
                                        <td className='text-center'>{formatCurrency0(coin.prixHier)}</td>
                                        <td className='text-center'>{coin.evolution24 === null ? "-" : `${formatNumber(coin.evolution24)} %`}</td>
                                        <td
                                            className={`text-center ${coin.evolutionCible > 0 ? "table-success" : "table-danger"
                                                }`}
                                        >
                                            {coin.evolutionCible === null
                                                ? "-"
                                                : `${formatNumber(coin.evolutionCible)} %`}
                                        </td>
                                        <td className='text-center'>{formatCurrency0(coin.market_cap)}</td>
                                        <td className='text-center'>{formatCurrency0(coin.volume)}</td>
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

export default Ventes;
