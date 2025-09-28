import AuditLog from '../models/AuditLog.js';

// Get all audit logs for owner
export const getOwnerAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({ performed_by: req.user._id }).sort({ created_at: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
