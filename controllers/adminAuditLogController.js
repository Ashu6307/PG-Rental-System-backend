// adminAuditLogController.js
// Controller for admin audit logs (industry-level)

const AuditLog = require('../models/AuditLog');

exports.listAuditLogs = async (req, res) => {
  try {
    const { user, action, dateFrom, dateTo } = req.query;
    let query = { isDeleted: false };
    if (user) query.user = user;
    if (action) query.action = action;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    const logs = await AuditLog.find(query).populate('user');
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
