import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Wallet from '../../pages/Wallet';
import Coins from '../../pages/Coins';
import Ventes from '../../pages/Ventes';
import Achats from '../../pages/Achats';
import Recap from '../../pages/Recap';
import CoinsAdmin from '../../pages/CoinsAdmin';
import Navbar from '../Navbar';
import LeftNav from '../LeftNav';

const RoutesLayout = () => {
    const [search, setSearch] = useState('');

    return (
        <Router>
            <Navbar search={search} onSearch={setSearch} />
            <LeftNav />

            <main className="coin-page">
                <Routes>
                    <Route path="/" element={<Wallet search={search} />} />
                    <Route path="/coins" element={<Coins search={search} />} />
                    <Route path="/ventes" element={<Ventes search={search} />} />
                    <Route path="/achats" element={<Achats search={search} />} />
                    <Route path="/recap" element={<Recap search={search} />} />
                    <Route path="/coins-admin" element={<CoinsAdmin search={search} />} />
                    <Route path="*" element={<Wallet search={search} />} />
                </Routes>
            </main>
        </Router>
    );
};

export default RoutesLayout;
