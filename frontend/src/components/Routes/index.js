import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Wallet from '../../pages/Wallet';
import Coins from '../../pages/Coins';
import Ventes from '../../pages/Ventes';
import Navbar from '../Navbar';
import LeftNav from '../LeftNav';

const index = () => {
    return (
        <Router>
            <Navbar />
            <LeftNav />

            <main className="coin-page">
                <Routes>
                    <Route path="/" element={<Wallet />} />
                    <Route path="/coins" element={<Coins />} />
                    <Route path="/ventes" element={<Ventes />} />
                    <Route path="*" element={<Wallet />} />
                </Routes>
            </main>
        </Router>
    );
};

export default index;
