const mongoose = require('mongoose');

const invoiceConfigSchema = new mongoose.Schema({
  header: { type: String },
  footer: { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InvoiceConfig', invoiceConfigSchema);
