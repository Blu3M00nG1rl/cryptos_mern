import React from 'react';

const Ventes = () => {
    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Ventes</h1>
                <div>
                    <button className="btn btn-primary">Nouvelle vente</button>
                </div>
            </div>

            <div className="card p-3 shadow-sm">
                <p className="mb-0">Aucune vente récente.</p>
            </div>
        </div>
    );
};

export default Ventes;