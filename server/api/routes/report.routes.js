const router = require("express").Router();
const controller = require("../controllers/report.controller");
const auth = require("../middleware/auth.middleware");

router.get("/trips", auth, controller.getTrips);
router.get("/stops", auth, controller.getStops);
router.get("/summary", auth, controller.getSummary);
router.get("/export", auth, controller.exportReport);

module.exports = router;
