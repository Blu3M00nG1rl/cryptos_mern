import React from 'react';
import { NavLink } from "react-router-dom";

const Navbar = () => {
    return (
        <nav>
            <div className="nav-container">
                <NavLink to="/" className="logo">
                    <img src="/img/icon.png" alt="icon" />
                    <h3>Cryptos</h3>
                </NavLink>

                <div className="nav-actions">
                    <div className="search">
                        <input type="search" placeholder="Rechercher une crypto..." />
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;