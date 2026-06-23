const router = require("express").Router();
const { getParams, updateParams } = require("../controllers/param.controller");

router.get("/", getParams);
router.post("/", updateParams);

module.exports = router;