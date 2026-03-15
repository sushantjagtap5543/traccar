const express = require("express");
const router = express.Router();
const controller = require("../controllers/trackingController");

module.exports = (io) => {
  // Device sends GPS data to this endpoint
  router.post("/update", controller.receiveData(io));
  
  return router;
};
