const userService = require("../services/user.service");

exports.getUsers = async (req, res) => {
  // Only admin should list users, or handle it based on requirements
  const users = await userService.getAllUsers();
  res.json(users);
};

exports.createUser = async (req, res) => {
  const user = await userService.createUser(req.body);
  
  // Remove password from response
  const { password: _, ...userResponse } = user;
  res.status(201).json(userResponse);
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  await userService.deleteUser(id);
  res.status(204).send();
};
