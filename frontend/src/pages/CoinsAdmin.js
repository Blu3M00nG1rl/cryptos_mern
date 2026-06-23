import React, { useEffect, useState } from "react";
import axios from "axios";

const CoinsAdmin = ({ search = '' }) => {
    const [coins, setCoins] = useState([]);
    const [form, setForm] = useState({ no: "", coinId: "", symbol: "", name: "" });
    const [editedCoins, setEditedCoins] = useState({});

    useEffect(() => {
        loadCoins();
    }, []);

    const normalizedSearch = (search || '').trim().toLowerCase();

    const filteredData = coins.filter(c =>
        !normalizedSearch ||
        c.symbol.toLowerCase().includes(normalizedSearch) ||
        c.name.toLowerCase().includes(normalizedSearch)
    );

    const loadCoins = async () => {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/backend/coin`);
        setCoins(res.data);
    };

    const createCoin = async () => {
        await axios.post(`${process.env.REACT_APP_API_URL}/backend/coin/create`, form);
        setForm({ no: "", coinId: "", symbol: "", name: "" });
        loadCoins();
    };

    const deleteCoin = async (id) => {
        await axios.delete(`${process.env.REACT_APP_API_URL}/backend/coin/${id}`);
        loadCoins();
    };

    const handleLocalChange = (id, field, value) => {
        setEditedCoins(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const saveCoin = async (id) => {
        if (!editedCoins[id]) return;

        try {
            await axios.put(`${process.env.REACT_APP_API_URL}/backend/coin/${id}`, editedCoins[id]);
            alert("Modifications enregistrées !");
        } catch (err) {
            console.error("Erreur sauvegarde", err);
        }
    };


    return (
        <div>
            <h1>Gestion des Coins</h1>
            <h5>Non trouvé, Non importé, Vérif wallet</h5>
            {/* CREATE */}
            <div className="card p-3 mb-4">
                <h4>Ajouter un coin</h4>
                <div className="row g-2">
                    <div className="col">
                        <input
                            className="form-control"
                            placeholder="no"
                            value={form.no}
                            onChange={(e) => setForm({ ...form, no: e.target.value })}
                        />
                    </div>
                    <div className="col">
                        <input
                            className="form-control"
                            placeholder="coinId"
                            value={form.coinId}
                            onChange={(e) => setForm({ ...form, coinId: e.target.value })}
                        />
                    </div>
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
                            className="form-control"
                            placeholder="nom"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>
                    <div className="col">
                        <input
                            className="form-control"
                            placeholder="rang"
                            value={form.rank}
                            onChange={(e) => setForm({ ...form, rank: e.target.value })}
                        />
                    </div>
                    <div className="col-auto">
                        <button className="btn btn-primary" onClick={createCoin}>
                            Ajouter
                        </button>
                    </div>
                </div>
            </div>

            {/* LIST + UPDATE + DELETE */}
            <div className="card p-3">
                <h4>Liste des coins</h4>

                <table className="table table-striped mt-3">
                    <thead>
                        <tr>
                            <th>No - Rang</th>
                            <th>Id - Stockage</th>
                            <th>Symbole - Date d'Achat</th>
                            <th>Nom - Observations</th>
                            <th>Date Vérif</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((c) => (
                            <React.Fragment key={c._id}>
                                {/* Première ligne */}
                                <tr>
                                    <td>
                                        <input
                                            className="form-control"
                                            value={editedCoins[c._id]?.no ?? c.no ?? ""}
                                            onChange={(e) => handleLocalChange(c._id, "no", e.target.value)}
                                        />
                                    </td>

                                    <td>
                                        <input
                                            className="form-control"
                                            value={editedCoins[c._id]?.coinId ?? c.coinId ?? ""}
                                            onChange={(e) => handleLocalChange(c._id, "coinId", e.target.value)}
                                        />
                                    </td>

                                    <td>
                                        <input
                                            className="form-control"
                                            value={editedCoins[c._id]?.symbol ?? c.symbol ?? ""}
                                            onChange={(e) => handleLocalChange(c._id, "symbol", e.target.value)}
                                        />
                                    </td>

                                    <td>
                                        <input
                                            className="form-control"
                                            value={editedCoins[c._id]?.name ?? c.name ?? ""}
                                            onChange={(e) => handleLocalChange(c._id, "name", e.target.value)}
                                        />
                                    </td>

                                    <td>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={
                                                editedCoins[c._id]?.dateVerif
                                                    ? editedCoins[c._id].dateVerif.slice(0, 10)
                                                    : c.dateVerif
                                                        ? c.dateVerif.slice(0, 10)
                                                        : ""
                                            }
                                            onChange={(e) => handleLocalChange(c._id, "dateVerif", e.target.value)}
                                        />
                                    </td>


                                    <td>
                                        <button
                                            className="btn btn-light mt-2"
                                            onClick={() => saveCoin(c._id)}
                                        >
                                            💾
                                        </button>
                                        <button
                                            className="btn btn-light mt-2 ml-1"
                                            onClick={() => deleteCoin(c._id)}
                                            title="Supprimer"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>

                                {/* Deuxième ligne */}
                                <tr>


                                    <td>
                                        <input
                                            className="form-control"
                                            value={editedCoins[c._id]?.rank ?? c.rank ?? ""}
                                            onChange={(e) => handleLocalChange(c._id, "rank", e.target.value)}
                                        />
                                    </td>

                                    <td style={{ minWidth: "250px" }}>
                                        <textarea
                                            className="form-control"
                                            rows={5}
                                            value={editedCoins[c._id]?.stockage ?? c.stockage ?? ""}
                                            onChange={(e) => handleLocalChange(c._id, "stockage", e.target.value)}
                                        />
                                    </td>

                                    <td>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={
                                                editedCoins[c._id]?.dateAchat
                                                    ? editedCoins[c._id].dateAchat.slice(0, 10)
                                                    : c.dateAchat
                                                        ? c.dateAchat.slice(0, 10)
                                                        : ""
                                            }
                                            onChange={(e) => handleLocalChange(c._id, "dateAchat", e.target.value)}
                                        />
                                    </td>

                                    <td style={{ minWidth: "400px" }}>
                                        <textarea
                                            className="form-control"
                                            rows={10}
                                            value={editedCoins[c._id]?.observation ?? c.observation ?? ""}
                                            onChange={(e) => handleLocalChange(c._id, "observation", e.target.value)}
                                        />
                                    </td>
                                </tr>
                            </React.Fragment>
                        ))}
                    </tbody>

                </table>
            </div>
        </div>
    );
};

export default CoinsAdmin;
