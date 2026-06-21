const router = require("express").Router();
const coinsNonImporteController = require('../controllers/coins_non_importe.controller.js');

router.post("/create", coinsNonImporteController.createCoinNI);
router.delete("/delete", coinsNonImporteController.deleteCoinsNI);

module.exports = router;