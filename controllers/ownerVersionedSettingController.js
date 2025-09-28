import VersionedSetting from '../models/VersionedSetting.js';

// Get all versioned settings for owner
async function getSettings(req, res) {
  try {
    const settings = await VersionedSetting.find({ ownerId: req.owner._id });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

// Create or update a versioned setting
async function upsertSetting(req, res) {
  try {
    const { key, value } = req.body;
    let setting = await VersionedSetting.findOne({ ownerId: req.owner._id, key });
    if (setting) {
      setting.history.push({ value: setting.value, version: setting.version, updatedAt: new Date() });
      setting.value = value;
      setting.version += 1;
      setting.updatedAt = new Date();
      await setting.save();
    } else {
      setting = new VersionedSetting({ ownerId: req.owner._id, key, value });
      await setting.save();
    }
    res.json(setting);
  } catch (err) {
    res.status(500).json({ error: 'Failed to upsert setting' });
  }
};

// Get history for a setting
async function getSettingHistory(req, res) {
  try {
    const { key } = req.params;
    const setting = await VersionedSetting.findOne({ ownerId: req.owner._id, key });
    if (!setting) return res.status(404).json({ error: 'Setting not found' });
    res.json(setting.history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
}

export default {
  getSettings,
  upsertSetting,
  getSettingHistory
};
