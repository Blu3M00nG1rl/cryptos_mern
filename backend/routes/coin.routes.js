const router = require("express").Router();
const coinController = require('../controllers/coin.controller.js');

router.post("/create", coinController.createCoin);
router.get("/", coinController.getAllCoins);
router.get("/note", coinController.getNote);
router.post("/note", coinController.saveNote);
router.get("/enBtc", coinController.getAllCoinsEnBtc);
router.get("/detail", coinController.getDetailAchatCoins);
router.post("/detail", coinController.createDetailAchat);
router.put("/detail/:id", coinController.updateDetailAchat);
router.delete("/detail/:id", coinController.deleteDetailAchat);
router.get("/detailEnBtc", coinController.getDetailAchatCoinsEnBtc);
router.post("/detailEnBtc", coinController.createDetailAchatEnBtc);
router.put("/detailEnBtc/:id", coinController.updateDetailAchatEnBtc);
router.delete("/detailEnBtc/:id", coinController.deleteDetailAchatEnBtc);
router.get("/:id", coinController.getCoinById);
router.put("/:id", coinController.updateCoin);
router.delete("/:id", coinController.deleteCoin);
router.get("/symbol/:symbol", coinController.getCoinBySymbol);

module.exports = router;