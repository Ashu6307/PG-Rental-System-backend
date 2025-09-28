import express from 'express';
import { getOwnerTenants, addOwnerTenant, updateOwnerTenant, deleteOwnerTenant } from '../controllers/ownerTenantController.js';
import { ownerAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', ownerAuth, getOwnerTenants);
router.post('/', ownerAuth, addOwnerTenant);
router.put('/:id', ownerAuth, updateOwnerTenant);
router.delete('/:id', ownerAuth, deleteOwnerTenant);

export default router;
