const router = require("express").Router();
const walletController = require('../controllers/wallet.controller.js');

router.get("/", walletController.getMyWallet);

module.exports = router;