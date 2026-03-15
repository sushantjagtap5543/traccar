const User = require("../models/User");

exports.createUser = async (data) => {

  const user = new User(data);

  return await user.save();

};

exports.getAllUsers = async () => {

  return await User.find().select("-password");

};

exports.getUserById = async (id) => {

  return await User.findById(id).select("-password");

};

exports.deleteUser = async (id) => {

  return await User.findByIdAndDelete(id);

};
