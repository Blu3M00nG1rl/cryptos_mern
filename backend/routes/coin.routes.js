const router = require("express").Router();
const coinController = require('../controllers/coin.controller.js');

router.post("/create", coinController.createCoin);
router.get("/", coinController.getAllCoins);
router.get("/:symbol", coinController.coinInfo);
router.put("/:symbol", coinController.updateCoin);
router.delete("/:symbol", coinController.deleteCoin);

module.exports = router;