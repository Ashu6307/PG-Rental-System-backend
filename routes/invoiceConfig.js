const express = require('express');
const InvoiceConfig = require('../models/InvoiceConfig');
const { authenticateJWT } = require('../middleware/auth');
const router = express.Router();

// Get invoice config
router.get('/', authenticateJWT, async (req, res) => {
  const config = await InvoiceConfig.findOne();
  res.json(config);
});

// Update invoice config (header/footer)
router.put('/', authenticateJWT, async (req, res) => {
  let config = await InvoiceConfig.findOne();
  if (!config) config = new InvoiceConfig();
  config.header = req.body.header;
  config.footer = req.body.footer;
  config.updatedBy = req.user.id;
  config.updatedAt = new Date();
  await config.save();
  res.json(config);
});

module.exports = router;
