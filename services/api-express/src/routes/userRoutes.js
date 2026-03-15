const express = require("express");

const router = express.Router();

const controller = require("../controllers/userController");

const auth = require("../middleware/authMiddleware");

const role = require("../middleware/roleMiddleware");

router.post("/login", controller.login);

router.get("/me", auth, controller.getMe);

router.put("/profile", auth, controller.updateProfile);

router.post(
  "/client",
  auth,
  role("admin"),
  controller.createClient
);

router.get(
  "/clients",
  auth,
  role("admin"),
  controller.getClients
);

router.get(
  "/client/:id",
  auth,
  role("admin"),
  controller.getClient
);

router.delete(
  "/client/:id",
  auth,
  role("admin"),
  controller.deleteClient
);

module.exports = router;
