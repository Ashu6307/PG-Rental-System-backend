// notificationPreferenceController.js
// Controller for user notification preferences

const NotificationPreference = require('../models/NotificationPreference');

exports.getUserPreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const prefs = await NotificationPreference.findOne({ user: userId, isDeleted: false });
    res.json({ success: true, preferences: prefs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateUserPreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const { email, sms, push, marketing, system } = req.body;
    let prefs = await NotificationPreference.findOne({ user: userId, isDeleted: false });
    if (!prefs) {
      prefs = new NotificationPreference({ user: userId, email, sms, push, marketing, system });
    } else {
      prefs.email = email;
      prefs.sms = sms;
      prefs.push = push;
      prefs.marketing = marketing;
      prefs.system = system;
    }
    await prefs.save();
    res.json({ success: true, preferences: prefs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
