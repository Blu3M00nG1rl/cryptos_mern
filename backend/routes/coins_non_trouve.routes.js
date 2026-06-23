const router = require("express").Router();
const coinsNonTrouveController = require('../controllers/coins_non_trouve.controller.js');

router.post("/create", coinsNonTrouveController.createCoinNF);
router.delete("/delete", coinsNonTrouveController.deleteCoinsNF);
router.get("/", coinsNonTrouveController.getCoinsNF);

module.exports = router;