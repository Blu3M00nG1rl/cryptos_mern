import React, { useEffect, useState } from "react";
import axios from "axios";

const CoinsAdmin = ({ search = '' }) => {
    const [coins, setCoins] = useState([]);
    const [form, setForm] = useState({
        no: "",
        coinId: "",
        symbol: "",
        name: ""
    });

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

    const updateCoin = async (id, field, value) => {
        await axios.put(`${process.env.REACT_APP_API_URL}/backend/coin/${id}`, {
            [field]: value
        });
        loadCoins();
    };

    const deleteCoin = async (id) => {
        await axios.delete(`${process.env.REACT_APP_API_URL}/backend/coin/${id}`);
        loadCoins();
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
                            placeholder="symbol"
                            value={form.symbol}
                            onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                        />
                    </div>
                    <div className="col">
                        <input
                            className="form-control"
                            placeholder="name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                            <th>No</th>
                            <th>Id</th>
                            <th>Symbol</th>
                            <th>Nom</th>
                            <th>Date achat</th>
                            <th>Nombre</th>
                            <th>Prix</th>
                            <th>Stockage</th>
                            <th>Date vérif</th>
                            <th>Observations</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((c) => (
                            <tr key={c._id}>
                                <td>
                                    <input
                                        className="form-control"
                                        value={c.no}
                                        onChange={(e) => updateCoin(c._id, "no", e.target.value)}
                                    />
                                </td>

                                <td>
                                    <input
                                        className="form-control"
                                        value={c.coinId}
                                        onChange={(e) => updateCoin(c._id, "coinId", e.target.value)}
                                    />
                                </td>

                                <td>
                                    <input
                                        className="form-control"
                                        value={c.symbol}
                                        onChange={(e) => updateCoin(c._id, "symbol", e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        className="form-control"
                                        value={c.name}
                                        onChange={(e) => updateCoin(c._id, "name", e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={c.dateAchat ? c.dateAchat.slice(0, 10) : ""}
                                        onChange={(e) => updateCoin(c._id, "dateAchat", e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={c.nombre || ""}
                                        onChange={(e) => updateCoin(c._id, "nombre", e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        step="0.00000001"
                                        className="form-control"
                                        value={c.prixCoin || ""}
                                        onChange={(e) => updateCoin(c._id, "prix", e.target.value)}
                                    />
                                </td>
                                <td style={{ minWidth: "250px" }}>
                                    <textarea
                                        className="form-control"
                                        rows={5}
                                        value={c.stockage || ""}
                                        onChange={(e) => updateCoin(c._id, "stockage", e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={c.dateVerif ? c.dateVerif.slice(0, 10) : ""}
                                        onChange={(e) => updateCoin(c._id, "dateVerif", e.target.value)}
                                    />
                                </td>
                                <td style={{ minWidth: "400px" }}>
                                    <textarea
                                        className="form-control"
                                        rows={10}
                                        value={c.observation || ""}
                                        onChange={(e) => updateCoin(c._id, "observation", e.target.value)}
                                    />
                                </td>
                                <td>
                                    <button className="btn btn-danger" onClick={() => deleteCoin(c._id)}>
                                        S
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CoinsAdmin;
