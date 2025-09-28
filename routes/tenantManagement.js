import express from 'express';
import {
  getOwnerTenants,
  addNewTenant,
  getTenantDetails,
  checkOutTenant,
  addTenantPayment,
  getRoomOccupancy,
  getOverdueTenants,
  updateTenantInfo
} from '../controllers/tenantManagementController.js';
import { ownerAuth } from '../middleware/auth.js';

const router = express.Router();

// Complete Tenant Management Routes for Owner Dashboard

// 1. Get all tenants with filtering and pagination
router.get('/', ownerAuth, getOwnerTenants);

// 2. Add new tenant (complete check-in process)
router.post('/add', ownerAuth, addNewTenant);

// 3. Get single tenant details
router.get('/:tenantId', ownerAuth, getTenantDetails);

// 4. Check-out tenant
router.post('/:tenantId/checkout', ownerAuth, checkOutTenant);

// 5. Add payment for tenant
router.post('/:tenantId/payment', ownerAuth, addTenantPayment);

// 6. Update tenant information
router.put('/:tenantId', ownerAuth, updateTenantInfo);

// 7. Get room-wise occupancy
router.get('/rooms/occupancy', ownerAuth, getRoomOccupancy);

// 8. Get overdue tenants
router.get('/dues/overdue', ownerAuth, getOverdueTenants);

export default router;
