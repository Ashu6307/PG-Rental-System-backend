// adminMultiTenancyController.js
// Industry-level multi-tenancy controller for Admin Dashboard
const Tenant = require('../models/Tenant');

// List tenants (with filters)
exports.listTenants = async (req, res) => {
  try {
    const { name, status, dateFrom, dateTo } = req.query;
    const query = {};
    if (name) query.name = { $regex: name, $options: 'i' };
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    const tenants = await Tenant.find(query).sort({ createdAt: -1 });
    res.json({ tenants });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
};

// Update tenant status
exports.updateTenantStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await Tenant.findByIdAndUpdate(req.params.id, { status });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update tenant status' });
  }
};

// Delete tenant
exports.deleteTenant = async (req, res) => {
  try {
    await Tenant.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete tenant' });
  }
};
