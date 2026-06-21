import React from 'react';
import { NavLink } from 'react-router-dom';

const LeftNav = () => {
    return (
        <div className="left-nav-cointainer">
            <div className="icons">
                <div className="icon-bis">
                    <NavLink to="/" title="Wallet" className={({ isActive }) => isActive ? "active-left-nav" : ""}>
                        <img src="/img/wallet.png" alt="wallet" />
                    </NavLink>

                    <NavLink to="/export" title="Export" className={({ isActive }) => isActive ? "active-left-nav" : ""}>
                        <img src="/img/excel.png" alt="export" />
                    </NavLink>

                    <NavLink to="/ventes" title="Ventes" className={({ isActive }) => isActive ? "active-left-nav" : ""}>
                        <img src="/img/sale.png" alt="ventes" />
                    </NavLink>

                    <NavLink to="/achats" title="Achats" className={({ isActive }) => isActive ? "active-left-nav" : ""}>
                        <img src="/img/buy.png" alt="achats" />
                    </NavLink>

                    <NavLink to="/coins-admin" title="CoinsAdmin" className={({ isActive }) => isActive ? "active-left-nav" : ""}>
                        <img src="/img/admin.png" alt="coins-admin" />
                    </NavLink>

                    <NavLink to="/coins" title="Coins" className={({ isActive }) => isActive ? "active-left-nav" : ""}>
                        <img src="/img/coins.png" alt="coins" />
                    </NavLink>
                </div>
            </div>
        </div>
    );
};

export default LeftNav;
