// adminApprovalWorkflowController.js
// Industry-level approval workflows controller for Admin Dashboard
const ApprovalWorkflow = require('../models/ApprovalWorkflow');

// List approval workflows (with filters)
exports.listApprovalWorkflows = async (req, res) => {
  try {
    const { type, status, user, dateFrom, dateTo } = req.query;
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (user) query.user = user;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    const workflows = await ApprovalWorkflow.find(query).populate('user').sort({ createdAt: -1 });
    res.json({ workflows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch approval workflows' });
  }
};

// Update workflow status
exports.updateWorkflowStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await ApprovalWorkflow.findByIdAndUpdate(req.params.id, { status });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update workflow status' });
  }
};

// Delete workflow
exports.deleteWorkflow = async (req, res) => {
  try {
    await ApprovalWorkflow.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
};
