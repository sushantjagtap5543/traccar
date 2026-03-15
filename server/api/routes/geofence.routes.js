const router = require("express").Router();
const controller = require("../controllers/geofence.controller");
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

router.post("/", auth, role("admin"), controller.createGeofence);
router.get("/", auth, role("admin"), controller.getGeofences);
router.delete("/:id", auth, role("admin"), controller.deleteGeofence);
router.post("/assign", auth, role("admin"), controller.assignGeofence);

module.exports = router;
