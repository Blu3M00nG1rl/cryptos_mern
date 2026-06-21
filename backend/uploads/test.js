require('dotenv').config({ path: '../config/.env' });
const axios = require('axios');

// ===== PARAMS
const marketCapMinEUR = process.env.MARKETCAP_MIN_EUR;
const jnee = new Date().toISOString().slice(0, 10);
const jneeProjection = process.env.NB_JOURS_PROJECTION
    ? new Date(Date.now() - process.env.NB_JOURS_PROJECTION * 24 * 60 * 60 * 1000)
    : new Date(0);
console.log(jneeProjection);
