import React from 'react';

const sampleCoins = [
    { symbol: 'BTC', name: 'Bitcoin', img: '/img/coins/btc.png', price: '42,000 €' },
    { symbol: 'ETH', name: 'Ethereum', img: '/img/coins/ethw.png', price: '2,900 €' },
    { symbol: 'SOL', name: 'Solana', img: '/img/coins/Spk.png', price: '25 €' },
    { symbol: 'USDT', name: 'Tether', img: '/img/coins/usdtb.png', price: '1.00 €' },
];

const Coins = () => {
    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Cryptomonnaies</h1>
                <div>
                    <button className="btn btn-primary">Importer</button>
                </div>
            </div>

            <div className="row">
                {sampleCoins.map((c) => (
                    <div className="col-sm-6 col-md-4 col-lg-3 mb-4" key={c.symbol}>
                        <div className="card p-3 h-100 shadow-sm">
                            <div className="d-flex align-items-center gap-3">
                                <img src={c.img} alt={c.name} style={{ width: 48, height: 48 }} />
                                <div>
                                    <h5 className="mb-1">{c.name}</h5>
                                    <small className="text-muted">{c.symbol}</small>
                                </div>
                            </div>

                            <div className="mt-3 d-flex justify-content-between align-items-center">
                                <strong>{c.price}</strong>
                                <button className="btn btn-sm btn-outline-primary">Détails</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Coins;