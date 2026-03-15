const router = require("express").Router();
const controller = require("../controllers/position.controller");
const auth = require("../middleware/auth.middleware");

module.exports = (io) => {
  router.get("/", auth, controller.getPositions);
  router.post("/update", controller.updatePosition(io));
  return router;
};
