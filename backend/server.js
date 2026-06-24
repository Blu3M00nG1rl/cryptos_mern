require('dotenv').config({path: './config/.env'});
const express = require('express');
const connectDB = require("./config/db");
const cors = require('cors');

const bodyParser = require('body-parser');
const coinRoutes = require('./routes/coin.routes');
const coinsNonTrouveRoutes = require('./routes/coins_non_trouve.routes');
const coinsNonImporteRoutes = require('./routes/coins_non_importe.routes');
const historyRoutes = require('./routes/history.routes');
const bitcoinRoutes = require('./routes/bitcoin.routes');
const maintenanceRoutes = require('./routes/maintenance.routes');
const paramsRoutes = require('./routes/param.routes');

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
app.use(process.env.ROUTES_PREFIX+'/coin', coinRoutes);
app.use(process.env.ROUTES_PREFIX+'/coins_non_trouve', coinsNonTrouveRoutes);
app.use(process.env.ROUTES_PREFIX+'/coins_non_importe', coinsNonImporteRoutes);
app.use(process.env.ROUTES_PREFIX+'/history', historyRoutes);
app.use(process.env.ROUTES_PREFIX+'/bitcoin', bitcoinRoutes);
app.use(process.env.ROUTES_PREFIX+'/maintenance', maintenanceRoutes);
app.use(process.env.ROUTES_PREFIX+'/param', paramsRoutes);
app.use(process.env.ROUTES_PREFIX+'/note', paramsRoutes);


// server
const startServer = async () => {
    await connectDB(); // 🔥 CRUCIAL

    app.listen(process.env.PORT, () => {
        console.log("Server running on port "+process.env.PORT);
    });
};

startServer();