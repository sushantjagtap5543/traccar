const router = require("express").Router();
const controller = require("../controllers/position.controller");
const auth = require("../middleware/auth.middleware");

router.get("/", auth, controller.getLatestPositions);
router.get("/history", auth, controller.getPositionHistory);

module.exports = router;
