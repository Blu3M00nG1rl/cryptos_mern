import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { NavLink } from "react-router-dom";

const Navbar = ({ search = '', onSearch = () => { } }) => {
    const [loadingJ, setLoadingJ] = useState(false);
    const [loadingH, setLoadingH] = useState(false);
    const [message, setMessage] = useState('');

    const handleImportJ = async () => {
        setLoadingJ(true);
        setMessage('');
        console.log(process.env.REACT_APP_API_URL);
        try {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/backend/history/importJ`);
            setMessage(`✅ Import terminé: ${res.data.importedCount} lignes importées`);
        } catch (err) {
            setMessage('❌ Erreur lors de l\'import');
            console.error(err);
        } finally {
            setLoadingJ(false);
        }
    };

    const handleImportH = async () => {
        setLoadingH(true);
        setMessage('');
        console.log(process.env.REACT_APP_API_URL);
        try {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/backend/history/importH`);
            setMessage(`✅ Import terminé: ${res.data.importedCount} lignes importées`);
        } catch (err) {
            setMessage('❌ Erreur lors de l\'import');
            console.error(err);
        } finally {
            setLoadingH(false);
        }
    };

    const handleMaj = async () => {
        setLoadingJ(true);
        setMessage('');

        try {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/backend/maintenance/maj`);
            setMessage(`✅ Mise à jour complète terminée`);
            console.log(res.data);
        } catch (err) {
            setMessage('❌ Erreur lors de la mise à jour');
            console.error(err);
        } finally {
            setLoadingJ(false);
        }
    };


    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);


    return (
        <nav>
            <div className="nav-container">

                <div>
                    <p className="m-0">1 - Chargement historique Bitcoin</p>
                </div>

                <div>
                    <button className="btn btn-info" disabled={loadingJ} onClick={handleMaj}>
                        {loadingJ && <span className="spinner-border spinner-border-sm me-2"></span>}
                        2 - Maj
                    </button>
                </div>

                <NavLink to="/" className="logo">
                    <img src="/img/icon.png" alt="icon" />
                    <h3>Cryptos</h3>
                </NavLink>

                <div className="nav-actions">
                    <div className="search">
                        <input
                            type="search"
                            placeholder="Rechercher une crypto..."
                            value={search}
                            onChange={(e) => onSearch(e.target.value)}
                        />
                    </div>
                </div>

            </div>

            {message && (
                <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'}`} role="alert">
                    {message}
                </div>
            )}
        </nav>
    );
};

export default Navbar;