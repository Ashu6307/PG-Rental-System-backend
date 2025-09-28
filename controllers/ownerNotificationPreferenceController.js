import NotificationPreference from '../models/NotificationPreference.js';

// Get preferences for owner
async function getPreferences(req, res) {
  try {
    const pref = await NotificationPreference.findOne({ ownerId: req.owner._id });
    res.json(pref || {});
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
};

// Update preferences for owner
async function updatePreferences(req, res) {
  try {
    const update = req.body;
    const pref = await NotificationPreference.findOneAndUpdate(
      { ownerId: req.owner._id },
      { ...update, updatedAt: Date.now() },
      { new: true, upsert: true }
    );
    res.json(pref);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update preferences' });
  }
}

export default {
  getPreferences,
  updatePreferences
};
