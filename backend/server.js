require('dotenv').config({path: './config/.env'});
const express = require('express');
const connectDB = require("./config/db");
const cors = require('cors');

const bodyParser = require('body-parser');
const coinRoutes = require('./routes/coin.routes');
const coinsNonTrouveRoutes = require('./routes/coins_non_trouve.routes');
const historyRoutes = require('./routes/history.routes');
const walletRoutes = require('./routes/wallet.routes');

const app = express();
app.use(express.json());

const corsOptions = {
    origin: process.env.CLIENT_URL,
    credentials: true,
    "allowedHeaders": ['sessionId', 'Content-Type'],
    "exposedHeaders": ['sessionId'],
    "methods": 'GET,HEAD,PUT,PATCH,POST,DELETE',
    "preflightContinue": false
}

app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}))

// routes
app.use(process.env.API_URL+'/coin', coinRoutes);
app.use(process.env.API_URL+'/coins_non_trouve', coinsNonTrouveRoutes);
app.use(process.env.API_URL+'/history', historyRoutes);
app.use(process.env.API_URL+'/wallet', walletRoutes);

// server
const startServer = async () => {
    await connectDB(); // 🔥 CRUCIAL

    app.listen(process.env.PORT, () => {
        console.log("Server running on port "+process.env.PORT);
    });
};

startServer();