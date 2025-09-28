// adminSettingsController.js
// Industry-level settings management (versioned, audit) controller for Admin Dashboard
const Settings = require('../models/Settings');
const AuditLog = require('../models/ActivityLog');

// List settings (with filters)
exports.listSettings = async (req, res) => {
  try {
    const { version, key, dateFrom, dateTo } = req.query;
    const query = {};
    if (version) query.version = version;
    if (key) query.key = { $regex: key, $options: 'i' };
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    const settings = await Settings.find(query).sort({ createdAt: -1 });
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

// Update setting (creates new version, logs audit)
exports.updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    // Get latest version
    const latest = await Settings.findOne({ key }).sort({ version: -1 });
    const newVersion = latest ? latest.version + 1 : 1;
    const setting = await Settings.create({ key, value, version: newVersion });
    await AuditLog.create({ action: 'update_setting', details: { key, value, version: newVersion } });
    res.json({ success: true, setting });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update setting' });
  }
};

// Delete setting
exports.deleteSetting = async (req, res) => {
  try {
    await Settings.findByIdAndDelete(req.params.id);
    await AuditLog.create({ action: 'delete_setting', details: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete setting' });
  }
};
