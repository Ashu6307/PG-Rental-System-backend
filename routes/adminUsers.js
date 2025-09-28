const express = require('express');
const router = express.Router();
const adminUserController = require('../controllers/adminUserController');
const adminAuth = require('../middleware/adminAuth');

// List users
router.get('/', adminAuth, adminUserController.listUsers);
// Add user
router.post('/add', adminAuth, adminUserController.addUser);
// Edit user
router.put('/edit/:id', adminAuth, adminUserController.editUser);
// Delete user (soft delete)
router.delete('/delete/:id', adminAuth, adminUserController.deleteUser);

module.exports = router;