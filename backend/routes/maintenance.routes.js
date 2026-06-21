const router = require("express").Router();
const maintenanceController = require("../controllers/maintenance.controller");

router.post("/maj", maintenanceController.runMaj);

module.exports = router;