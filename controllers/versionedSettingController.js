// versionedSettingController.js
// Controller for versioned settings (industry-level)

const VersionedSetting = require('../models/VersionedSetting');

exports.getUserSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const settings = await VersionedSetting.find({ user: userId, isDeleted: false }).sort({ updatedAt: -1 });
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addOrUpdateSetting = async (req, res) => {
  try {
    const userId = req.user._id;
    const { key, value, version } = req.body;
    let setting = await VersionedSetting.findOne({ user: userId, key, isDeleted: false });
    if (!setting) {
      setting = new VersionedSetting({ user: userId, key, value, version });
    } else {
      setting.value = value;
      setting.version = version;
      setting.updatedAt = new Date();
    }
    await setting.save();
    res.json({ success: true, setting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteSetting = async (req, res) => {
  try {
    const settingId = req.params.id;
    const setting = await VersionedSetting.findById(settingId);
    if (!setting) return res.status(404).json({ success: false, message: 'Setting not found' });
    setting.isDeleted = true;
    await setting.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
