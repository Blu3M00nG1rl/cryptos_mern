const router = require("express").Router();
const historyController = require('../controllers/history.controller.js');

router.put("/update", historyController.updateHistory);
router.delete("/delete", historyController.deleteHistory);
router.get("/stats", historyController.getStats);
router.post("/importJ", historyController.runImportJ);
router.post("/importH", historyController.runImportH);
router.get("/export", historyController.getExportData);
router.get("/ventes", historyController.getVentesData);
router.get("/achats", historyController.getAchatsData);
router.get("/synthese", historyController.getSyntheseData);

module.exports = router;