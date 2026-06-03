const router = require("express").Router();
const euroController = require('../controllers/euro.controller.js');

router.post("/create", euroController.createCoin);

module.exports = router;