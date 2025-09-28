const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const auth = require('../middleware/auth');

// Get user's tenant info
router.get('/my', auth, tenantController.getUserTenant);
// Update tenant settings
router.post('/update', auth, tenantController.updateTenantSettings);

module.exports = router;