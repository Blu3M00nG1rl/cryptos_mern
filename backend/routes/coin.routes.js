const router = require("express").Router();
const coinController = require('../controllers/coin.controller.js');

router.post("/create", coinController.createCoin);
router.get("/", coinController.getAllCoins);
router.get("/:id", coinController.getCoinById);
router.put("/:id", coinController.updateCoin);
router.delete("/:id", coinController.deleteCoin);
router.get("/symbol/:symbol", coinController.getCoinBySymbol);

module.exports = router;