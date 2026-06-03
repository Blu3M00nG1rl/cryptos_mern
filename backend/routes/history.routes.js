const router = require("express").Router();
const historyController = require('../controllers/history.controller.js');

router.put("/update", historyController.updateHistory);
router.delete("/delete", historyController.deleteHistory);

module.exports = router;