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

                    <NavLink to="/coins" title="Coins" className={({ isActive }) => isActive ? "active-left-nav" : ""}>
                        <img src="/img/coins.png" alt="coins" />
                    </NavLink>

                    <NavLink to="/ventes" title="Ventes" className={({ isActive }) => isActive ? "active-left-nav" : ""}>
                        <img src="/img/sale.png" alt="ventes" />
                    </NavLink>
                </div>
            </div>
        </div>
    );
};

export default LeftNav;
