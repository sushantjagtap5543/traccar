const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../../config/env");

const SECRET = JWT_SECRET;

exports.generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role
    },
    SECRET,
    { expiresIn: "12h" }
  );
};

exports.verifyToken = (token) => {
  return jwt.verify(token, SECRET);
};
