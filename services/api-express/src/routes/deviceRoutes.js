const express = require("express");

const router = express.Router();

const controller = require("../controllers/deviceController");

const auth = require("../middleware/authMiddleware");

const role = require("../middleware/roleMiddleware");

// All device management routes are Admin only
router.post(
  "/",
  auth,
  role("admin"),
  controller.createDevice
);

router.get(
  "/",
  auth,
  role("admin"),
  controller.getDevices
);

router.put(
  "/:id",
  auth,
  role("admin"),
  controller.updateDevice
);

router.delete(
  "/:id",
  auth,
  role("admin"),
  controller.deleteDevice
);

router.post(
  "/assign",
  auth,
  role("admin"),
  controller.assignDevice
);

module.exports = router;
