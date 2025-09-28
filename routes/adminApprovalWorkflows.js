// adminApprovalWorkflows.js
const express = require('express');
const router = express.Router();
const adminApprovalWorkflowController = require('../controllers/adminApprovalWorkflowController');

// List approval workflows
router.get('/', adminApprovalWorkflowController.listApprovalWorkflows);
// Update workflow status
router.patch('/:id/status', adminApprovalWorkflowController.updateWorkflowStatus);
// Delete workflow
router.delete('/:id', adminApprovalWorkflowController.deleteWorkflow);

module.exports = router;
