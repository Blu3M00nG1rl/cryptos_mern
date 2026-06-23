            <div className="card p-3 shadow-sm">
                <h5 className="mb-3">Recap</h5>

                {loading ? (
                    <div>Chargement...</div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-sm">
                            <thead>
                                <tr>
                                    <th></th>

                                    <th onClick={() => requestSort("symbol")} style={{ cursor: "pointer" }}>
                                        Symbole
                                    </th>

                                    <th onClick={() => requestSort("name")} style={{ cursor: "pointer" }}>
                                        Nom
                                    </th>

                                    <th onClick={() => requestSort("nombre")} style={{ cursor: "pointer" }}>
                                        Nombre
                                    </th>

                                    <th onClick={() => requestSort("valeur")} style={{ cursor: "pointer" }}>
                                        Valeur
                                    </th>

                                    <th onClick={() => requestSort("dateVerif")} style={{ cursor: "pointer" }}>
                                        Date de vérification
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortData(owned)
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
                                            <td>{formatNumber(Number(c.nombre) || 0)}</td>
                                            <td>{formatCurrency((Number(c.nombre) || 0) * (Number(c.prixHistory) || 0))}</td>
                                            <td>{formatDate(c.dateVerif)}</td>
                                        </tr>
                                    ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <th></th>
                                    <th colSpan="2">Total</th>
                                    <th>{formatNumber(totalNombre)}</th>
                                    <th>{formatCurrency(totalValeur)}</th>
                                </tr>
                            </tfoot>
                        </table>
                        {owned.length === 0 && <div className="text-muted">Aucune crypto possédée (nombre &gt; 0).</div>}
                    </div>
                )}
            </div>