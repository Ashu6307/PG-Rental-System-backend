import express from 'express';
import { 
  getOwnerDashboardOverview,
  getOwnerRoomStats,
  getOwnerTenantStats,
  getOwnerFinancialStats,
  getOwnerMaintenanceStats,
  getOwnerUtilityStats,
  getOwnerRecentActivities,
  // Smart Electricity Billing Functions
  addMeterReading,
  generateElectricityBills,
  sendElectricityBills,
  getElectricityBillingDashboard,
  // Advanced Tenant Management
  addNewResident,
  // Advanced Notification System
  sendAdvancedNotification,
  // Advanced Analytics
  getAdvancedAnalytics,
  // Enhanced Tenant Analytics
  getOwnerTenantAnalytics,
  getRoomOccupancyStatus,
  getRecentTenantActivities,
  getTenantPaymentOverview
} from '../controllers/ownerDashboardController.js';
import { authenticateJWT, ownerAuth } from '../middleware/auth.js';

const router = express.Router();

// Main Dashboard Routes
router.get('/overview', authenticateJWT, ownerAuth, getOwnerDashboardOverview);

// Property Management Routes
router.get('/rooms', authenticateJWT, ownerAuth, getOwnerRoomStats);
router.get('/tenants', authenticateJWT, ownerAuth, getOwnerTenantStats);
router.get('/financial', authenticateJWT, ownerAuth, getOwnerFinancialStats);
router.get('/maintenance', authenticateJWT, ownerAuth, getOwnerMaintenanceStats);
router.get('/utilities', authenticateJWT, ownerAuth, getOwnerUtilityStats);
router.get('/activities', authenticateJWT, ownerAuth, getOwnerRecentActivities);

// Smart Electricity Billing Routes
router.post('/billing/meter-reading', ownerAuth, addMeterReading);
router.post('/billing/generate-bills', ownerAuth, generateElectricityBills);
router.post('/billing/send-bills', ownerAuth, sendElectricityBills);
router.get('/billing/dashboard', ownerAuth, getElectricityBillingDashboard);

// Advanced Tenant Management Routes
router.post('/residents/add', ownerAuth, addNewResident);

// Advanced Notification Routes
router.post('/notifications/send', ownerAuth, sendAdvancedNotification);

// Advanced Analytics Routes
router.get('/analytics/advanced', ownerAuth, getAdvancedAnalytics);

// Enhanced Tenant Tracking Routes
router.get('/analytics/tenants', authenticateJWT, ownerAuth, getOwnerTenantAnalytics);
router.get('/occupancy/status', authenticateJWT, ownerAuth, getRoomOccupancyStatus);
router.get('/activities/tenants', authenticateJWT, ownerAuth, getRecentTenantActivities);
router.get('/payments/overview', authenticateJWT, ownerAuth, getTenantPaymentOverview);

export default router;
