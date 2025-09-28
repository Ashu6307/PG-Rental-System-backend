import OwnerProfile from '../models/OwnerProfile.js';

// Get owner profile
export const getOwnerProfile = async (req, res) => {
  try {
    const profile = await OwnerProfile.findOne({ owner_id: req.user._id });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update owner profile
export const updateOwnerProfile = async (req, res) => {
  try {
    const updateData = { ...req.body, updatedAt: new Date() };
    const profile = await OwnerProfile.findOneAndUpdate(
      { owner_id: req.user._id },
      updateData,
      { new: true }
    );
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Upload avatar
export const uploadAvatar = async (req, res) => {
  try {
    const { avatarUrl } = req.body;
    const profile = await OwnerProfile.findOneAndUpdate(
      { owner_id: req.user._id },
      { avatar: avatarUrl, updatedAt: new Date() },
      { new: true }
    );
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
