const UserService = require("../services/userService");
const User = require("../models/User");
const { hashPassword, comparePassword } = require("../utils/password");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").populate("devices");
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, password } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (password) updateData.password = await hashPassword(password);

    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.createClient = async (req, res) => {
  try {

    const data = req.body;

    data.password = await hashPassword(data.password);

    data.role = "client";

    const user = await UserService.createUser(data);

    res.json(user);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};

exports.getClients = async (req, res) => {

  try {

    const users = await UserService.getAllUsers();

    res.json(users);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};

exports.getClient = async (req, res) => {

  try {

    const user = await UserService.getUserById(req.params.id);

    res.json(user);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};

exports.deleteClient = async (req, res) => {

  try {

    await UserService.deleteUser(req.params.id);

    res.json({ message: "Client deleted" });

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};
