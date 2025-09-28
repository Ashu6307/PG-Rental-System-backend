// auditLogController.js
// Controller for user audit logs (industry-level)

const AuditLog = require('../models/AuditLog');

exports.getUserAuditLogs = async (req, res) => {
  try {
    const userId = req.user._id;
    const logs = await AuditLog.find({ user: userId, isDeleted: false }).sort({ createdAt: -1 });
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteAuditLog = async (req, res) => {
  try {
    const logId = req.params.id;
    const log = await AuditLog.findById(logId);
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });
    log.isDeleted = true;
    await log.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
