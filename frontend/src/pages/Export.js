import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const Export = ({ search = '' }) => {
    const [tableLoading, setTableLoading] = useState(true);
    const [data, setData] = useState([]);
    const [dateProjection, setDateProjection] = useState('');

    useEffect(() => {
        fetchExportData();
    }, []);

    const fetchExportData = async () => {
        try {
            setTableLoading(true);
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/backend/history/export`);
            if (res.data && res.data.length > 0) {
                setDateProjection(res.data[0].dateProjection);
            }
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setTableLoading(false);
        }
    };

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

    // 📌 Fonction d’export Excel
    const exportToExcel = () => {
        const exportData = data.map(coin => ({
            Coin: coin.name,
            ID: coin.symbol,
            Portefeuille: coin.nombre,
            "Prix du jour": coin.prixDuJour,
            Capitalisation: coin.capitalisation,
            "Volume 24h": coin.volume24h,
            [`Prix du ${dateProjection}`]: coin.prixProjection
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Export");

        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

        saveAs(blob, `export_coins_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Export</h1>

                {/* 🔥 Bouton Export Excel */}
                <button className="btn btn-success" onClick={exportToExcel}>
                    📥 Excel
                </button>
            </div>

            <div className="card p-4">
                <h2 className="mb-4">Récapitulatif</h2>
                {tableLoading ? (
                    <div className="text-center">
                        <p>Chargement des données...</p>
                    </div>
                ) : data.length === 0 ? (
                    <div className="alert alert-info">Aucune donnée disponible</div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-striped table-hover">
                            <thead className="table-dark">
                                <tr>
                                    <th>Rang</th>
                                    <th>Coins</th>
                                    <th>ID</th>
                                    <th>Portefeuille</th>
                                    <th>Prix du jour</th>
                                    <th>Capitalisation</th>
                                    <th>Volume 24h</th>
                                    <th>Prix au {dateProjection}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((coin, index) => (
                                    <tr key={index}>
                                         <td>{coin.rank}</td>
                                        <td>{coin.name}</td>
                                        <td><strong>{coin.symbol}</strong></td>
                                        <td>{coin.nombre}</td>
                                        <td>{formatNumber(coin.prixDuJour)}</td>
                                        <td>{formatNumber(coin.capitalisation)}</td>
                                        <td>{formatNumber(coin.volume24h)}</td>
                                        <td>{formatNumber(coin.prixProjection)}</td>
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

export default Export;
