import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { NavLink } from "react-router-dom";

const Navbar = ({ search = '', onSearch = () => { } }) => {
    const [loadingJ, setLoadingJ] = useState(false);
    const [loadingH, setLoadingH] = useState(false);
    const [message, setMessage] = useState('');
    const [dominance, setDominance] = useState("");
    const [saving, setSaving] = useState(false);

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
        } catch (err) {
            setMessage('❌ Erreur lors de la mise à jour');
            console.error(err);
        } finally {
            setLoadingJ(false);
        }
    };

    const handleSaveParams = async () => {
        setSaving(true);
        try {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/backend/param`, {
                dominance: Number(dominance)
            });

            setMessage("✅ Paramètres mis à jour");

        } catch (err) {
            setMessage("❌ Erreur sauvegarde paramètres");
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        const fetchParams = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/backend/param`);
                if (res.data) {
                    setDominance(res.data.dominance);
                }
            } catch (err) {
                console.error("Erreur chargement params", err);
            }
        };

        fetchParams();

        if (message) {
            const timer = setTimeout(() => setMessage(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    return (
        <nav>
            <div className="nav-container">

                {/* --- LOGO CENTRÉ --- */}
                <NavLink to="/" className="logo">
                    <h3>Gestion Cryptomonnaies</h3>
                </NavLink>

                {/* --- BOUTONS IMPORT / MAJ --- */}
                <div className="d-flex align-items-center gap-3">

                    <div>1-Historique Bitcoin</div>

                    <button className="btn btn-info btn-sm" disabled={loadingJ} onClick={handleMaj}>
                        {loadingJ && <span className="spinner-border spinner-border-sm me-2"></span>}
                        2-Maj
                    </button>

                    {/* --- INPUT DOMINANCE --- */}
                    <div className="d-flex align-items-center gap-3">
                        <label className="small text-muted">3-Dominance</label>
                        <input
                            type="number"
                            className="form-control form-control-sm"
                            value={dominance}
                            onChange={(e) => setDominance(e.target.value)}
                            style={{ width: "90px" }}
                        />
                        {/* --- BOUTON SAUVEGARDE AVEC ICÔNE DISQUETTE --- */}
                        <button
                            className="btn btn-warning btn-sm d-flex align-items-center"
                            onClick={handleSaveParams}
                            disabled={saving}
                            title="Sauvegarder"
                        >
                            {saving ? (
                                <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                                <i className="bi bi-save"></i>
                            )}
                        </button>
                    </div>


                </div>

                {/* --- SEARCH --- */}
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
                <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'} mt-2`} role="alert">
                    {message}
                </div>
            )}
        </nav>
    );
};

export default Navbar;