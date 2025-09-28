// adminPGController.js
// Controller for admin PG/Bike/Owner management (approve/reject, industry-level)

const PG = require('../models/PG');
const Bike = require('../models/Bike');
const Owner = require('../models/Owner');

exports.listPGs = async (req, res) => {
  try {
    const pgs = await PG.find({ isDeleted: false });
    res.json({ success: true, pgs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.approvePG = async (req, res) => {
  try {
    const pg = await PG.findById(req.params.id);
    if (!pg || pg.isDeleted) return res.status(404).json({ success: false, message: 'PG not found' });
    pg.status = 'approved';
    await pg.save();
    res.json({ success: true, pg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.rejectPG = async (req, res) => {
  try {
    const pg = await PG.findById(req.params.id);
    if (!pg || pg.isDeleted) return res.status(404).json({ success: false, message: 'PG not found' });
    pg.status = 'rejected';
    await pg.save();
    res.json({ success: true, pg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listBikes = async (req, res) => {
  try {
    const bikes = await Bike.find({ isDeleted: false });
    res.json({ success: true, bikes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.approveBike = async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id);
    if (!bike || bike.isDeleted) return res.status(404).json({ success: false, message: 'Bike not found' });
    bike.status = 'approved';
    await bike.save();
    res.json({ success: true, bike });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.rejectBike = async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id);
    if (!bike || bike.isDeleted) return res.status(404).json({ success: false, message: 'Bike not found' });
    bike.status = 'rejected';
    await bike.save();
    res.json({ success: true, bike });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listOwners = async (req, res) => {
  try {
    const owners = await Owner.find({ isDeleted: false });
    res.json({ success: true, owners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.approveOwner = async (req, res) => {
  try {
    const owner = await Owner.findById(req.params.id);
    if (!owner || owner.isDeleted) return res.status(404).json({ success: false, message: 'Owner not found' });
    owner.status = 'approved';
    await owner.save();
    res.json({ success: true, owner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.rejectOwner = async (req, res) => {
  try {
    const owner = await Owner.findById(req.params.id);
    if (!owner || owner.isDeleted) return res.status(404).json({ success: false, message: 'Owner not found' });
    owner.status = 'rejected';
    await owner.save();
    res.json({ success: true, owner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
