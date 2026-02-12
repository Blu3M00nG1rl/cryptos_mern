import { BrowserRouter as Router, Routes, Route, Redirect} from 'react-router-dom';
import Wallet from '../../pages/Wallet';
import Coins from '../../pages/Coins';
import Ventes from '../../pages/Ventes';

const index = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Wallet/>} />
                <Route path="/coins" element={<Coins/>} />
                <Route path="/ventes" element={<Ventes/>} />
                <Route path="*" element={<Wallet/>} />
            </Routes>
        </Router>
    );
};

export default index;
