const express = require('express');
const bodyParser = require('body-parser');
const coinRoutes = require('./routes/coin.routes');
require('dotenv').config({path: './config/.env'});
require('./config/db');
const cors = require('cors');

const app = express();

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
app.use('/backend/euro/coin', coinRoutes);

// server
app.listen(process.env.PORT, () => {
    console.log("Listening on port "+process.env.PORT)
})