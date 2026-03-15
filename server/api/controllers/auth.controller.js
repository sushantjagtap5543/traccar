const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/jwt");
const userService = require("../services/user.service");

exports.login = async (req, res) => {

  const { email, password } = req.body;

  const user = await userService.findUserByEmail(email);

  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(401).json({ message: "Invalid password" });
  }

  const token = generateToken(user);

  res.json({
    token,
    user
  });

};
