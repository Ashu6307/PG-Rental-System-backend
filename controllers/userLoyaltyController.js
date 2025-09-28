import Loyalty from '../models/Loyalty.js';

// Get loyalty info for user
async function getLoyalty(req, res) {
  try {
    const loyalty = await Loyalty.findOne({ userId: req.user._id });
    res.json(loyalty || { points: 0, rewards: [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch loyalty info' });
  }
};

// Add points to user
async function addPoints(req, res) {
  try {
    const { points } = req.body;
    let loyalty = await Loyalty.findOne({ userId: req.user._id });
    if (!loyalty) loyalty = new Loyalty({ userId: req.user._id });
    loyalty.points += points;
    loyalty.lastUpdated = Date.now();
    await loyalty.save();
    res.json(loyalty);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add points' });
  }
};

// Redeem reward
async function redeemReward(req, res) {
  try {
    const { rewardId } = req.body;
    const loyalty = await Loyalty.findOne({ userId: req.user._id });
    if (!loyalty) return res.status(404).json({ error: 'No loyalty info found' });
    const reward = loyalty.rewards.id(rewardId);
    if (!reward || reward.redeemed) return res.status(400).json({ error: 'Reward not available' });
    reward.redeemed = true;
    reward.redeemedAt = Date.now();
    await loyalty.save();
    res.json(loyalty);
  } catch (err) {
    res.status(500).json({ error: 'Failed to redeem reward' });
  }
}

export default {
  getLoyalty,
  addPoints,
  redeemReward
};
