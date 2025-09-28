// softDeleteController.js
// Industry-level soft delete + audit log controller
import AuditLog from '../models/AuditLog.js';

// Generic soft delete for any model
export const softDelete = async (req, res) => {
  try {
    const { model, id, userId } = req.body;
    const Model = await import(`../models/${model}.js`);
    const doc = await Model.default.findById(id);
    if (!doc) return res.status(404).json({ error: `${model} not found` });
    doc.status = 'deleted';
    await doc.save();
    await AuditLog.create({ action: 'soft_delete', user: userId, targetType: model, targetId: id, details: { status: 'deleted' } });
    res.json({ success: true, message: `${model} soft deleted`, doc });
  } catch (err) {
    res.status(500).json({ error: 'Failed to soft delete' });
  }
};

// Restore soft deleted record
export const restore = async (req, res) => {
  try {
    const { model, id, userId } = req.body;
    const Model = await import(`../models/${model}.js`);
    const doc = await Model.default.findById(id);
    if (!doc) return res.status(404).json({ error: `${model} not found` });
    doc.status = 'active';
    await doc.save();
    await AuditLog.create({ action: 'restore', user: userId, targetType: model, targetId: id, details: { status: 'active' } });
    res.json({ success: true, message: `${model} restored`, doc });
  } catch (err) {
    res.status(500).json({ error: 'Failed to restore' });
  }
};

export default { softDelete, restore };
