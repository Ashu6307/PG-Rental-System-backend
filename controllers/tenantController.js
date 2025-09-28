// tenantController.js
// Controller for multi-tenancy settings (industry-level)

const Tenant = require('../models/Tenant');

exports.getUserTenant = async (req, res) => {
  try {
    // Assume user has tenantId in profile
    const tenantId = req.user.tenantId;
    const tenant = await Tenant.findById(tenantId);
    res.json({ success: true, tenant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTenantSettings = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { settings } = req.body;
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
    tenant.settings = settings;
    tenant.updatedAt = new Date();
    await tenant.save();
    res.json({ success: true, tenant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
