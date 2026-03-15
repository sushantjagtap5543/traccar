const db = require("../../config/database");
const bcrypt = require("bcryptjs");

exports.findUserByEmail = async (email) => {
  return await db.users.findOne({ email });
};

exports.getAllUsers = async () => {
  return await db.users.find({});
};

exports.createUser = async (userData) => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  return await db.users.insert({
    ...userData,
    password: hashedPassword,
    createdAt: new Date()
  });
};

exports.deleteUser = async (id) => {
  return await db.users.delete({ id: parseInt(id) });
};
