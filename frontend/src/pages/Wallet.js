import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Wallet = () => {
    const [coins, setCoins] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCoins = async () => {
            try {
                const res = await axios.get('http://localhost:5001/backend/coin');
                setCoins(res.data || []);
            } catch (err) {
                console.error('Erreur récupération coins', err);
                setCoins([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCoins();
    }, []);

    const owned = coins.filter(c => c.nombre && Number(c.nombre) > 0);

    const totalNombre = owned.reduce((sum, c) => sum + (Number(c.nombre) || 0), 0);
    const totalValeur = owned.reduce((sum, c) => sum + ((Number(c.nombre) || 0) * (Number(c.prix) || 0)), 0);

    const formatNumber = (n) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 8 }).format(n);
    const formatCurrency = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Wallet</h1>
            </div>

            <div className="card p-3 shadow-sm mb-4">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h5>Solde total</h5>
                        <strong>{formatCurrency(totalValeur)}</strong>
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
                                    <th>Symbol</th>
                                    <th>Name</th>
                                    <th className="text-end">Nombre</th>
                                    <th className="text-end">Valeur</th>
                                </tr>
                            </thead>
                            <tbody>
                                {owned
                                    .slice()
                                    .sort((a, b) => ((Number(b.nombre) || 0) * (Number(b.prix) || 0)) - ((Number(a.nombre) || 0) * (Number(a.prix) || 0)))
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
                                            <td className="text-end">{formatNumber(Number(c.nombre) || 0)}</td>
                                            <td className="text-end">{formatCurrency((Number(c.nombre) || 0) * (Number(c.prix) || 0))}</td>
                                        </tr>
                                    ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <th></th>
                                    <th colSpan="2">Total</th>
                                    <th className="text-end">{formatNumber(totalNombre)}</th>
                                    <th className="text-end">{formatCurrency(totalValeur)}</th>
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