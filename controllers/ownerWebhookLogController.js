import WebhookLog from '../models/WebhookLog.js';

// Get all webhook logs for owner
async function getLogs(req, res) {
  try {
    const logs = await WebhookLog.find({ ownerId: req.owner._id }).sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch webhook logs' });
  }
};

// Create a new webhook log (for testing/demo)
async function createLog(req, res) {
  try {
    const log = new WebhookLog({ ...req.body, ownerId: req.owner._id });
    await log.save();
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create webhook log' });
  }
};

// Update webhook log status (for retry, etc.)
async function updateLog(req, res) {
  try {
    const { id } = req.params;
    const update = req.body;
    const log = await WebhookLog.findOneAndUpdate({ _id: id, ownerId: req.owner._id }, update, { new: true });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update webhook log' });
  }
}

export default {
  getLogs,
  createLog,
  updateLog
};
