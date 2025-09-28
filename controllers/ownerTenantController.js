import Tenant from '../models/Tenant.js';

// Get all tenants for owner
export const getOwnerTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find({ owner: req.user._id });
    res.json(tenants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add new tenant
export const addOwnerTenant = async (req, res) => {
  try {
    const { name, domain, settings } = req.body;
    const tenant = new Tenant({ name, domain, owner: req.user._id, settings });
    await tenant.save();
    res.status(201).json(tenant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update tenant
export const updateOwnerTenant = async (req, res) => {
  try {
    const { name, domain, settings } = req.body;
    const tenant = await Tenant.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { name, domain, settings },
      { new: true }
    );
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json(tenant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete tenant
export const deleteOwnerTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json({ message: 'Tenant deleted', tenant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
