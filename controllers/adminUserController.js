// adminUserController.js
// Controller for admin user management (add/edit/delete, RBAC, industry-level)

const User = require('../models/User');
const bcrypt = require('bcrypt');
const { assignRole, removeRole } = require('../utils/security');

exports.listUsers = async (req, res) => {
  try {
    const users = await User.find({ isDeleted: false });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hash, role });
    await user.save();
    if (role) await assignRole(user._id, role);
    res.status(201).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.editUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user || user.isDeleted) return res.status(404).json({ success: false, message: 'User not found' });
    user.name = name || user.name;
    user.email = email || user.email;
    if (role && role !== user.role) {
      await removeRole(user._id, user.role);
      await assignRole(user._id, role);
      user.role = role;
    }
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.isDeleted) return res.status(404).json({ success: false, message: 'User not found' });
    user.isDeleted = true;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
