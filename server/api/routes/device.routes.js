const router = require("express").Router();
const controller = require("../controllers/device.controller");
const auth = require("../middleware/auth.middleware");

router.get("/", auth, controller.getDevices);
router.post("/", auth, controller.addDevice);
router.put("/:id", auth, controller.updateDevice);
router.delete("/:id", auth, controller.deleteDevice);

module.exports = router;
