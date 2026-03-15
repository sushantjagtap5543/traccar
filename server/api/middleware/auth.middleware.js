const { verifyToken } = require("../utils/jwt");

module.exports = (req, res, next) => {

  const token = req.headers["authorization"];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = verifyToken(token.replace("Bearer ", ""));
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }

};
