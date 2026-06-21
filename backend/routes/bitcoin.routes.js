const router = require("express").Router();
const bitcoinController = require('../controllers/bitcoin.controller.js');

router.get("/max-diff", bitcoinController.getMaxDiff);
router.post("/importB", bitcoinController.runImportB);
module.exports = router;