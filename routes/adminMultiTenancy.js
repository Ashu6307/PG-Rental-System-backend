// adminMultiTenancy.js
const express = require('express');
const router = express.Router();
const adminMultiTenancyController = require('../controllers/adminMultiTenancyController');

// List tenants
router.get('/', adminMultiTenancyController.listTenants);
// Update tenant status
router.patch('/:id/status', adminMultiTenancyController.updateTenantStatus);
// Delete tenant
router.delete('/:id', adminMultiTenancyController.deleteTenant);

module.exports = router;
