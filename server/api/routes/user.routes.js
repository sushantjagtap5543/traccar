const router = require("express").Router();
const controller = require("../controllers/user.controller");
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

// Only admins can manage users
router.get("/", auth, role("admin"), controller.getUsers);
router.post("/", auth, role("admin"), controller.createUser);
router.delete("/:id", auth, role("admin"), controller.deleteUser);

module.exports = router;
