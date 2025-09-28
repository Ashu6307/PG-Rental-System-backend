import GDPRConsent from '../models/GDPRConsent.js';

// Get owner's GDPR consent status
export const getOwnerGDPRConsent = async (req, res) => {
  try {
    const consent = await GDPRConsent.findOne({ user: req.user._id });
    res.json(consent || { consentGiven: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update owner's GDPR consent
export const updateOwnerGDPRConsent = async (req, res) => {
  try {
    const { consentGiven, consentType } = req.body;
    const consent = await GDPRConsent.findOneAndUpdate(
      { user: req.user._id },
      { consentGiven, consentType, consentDate: new Date(), updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json(consent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
