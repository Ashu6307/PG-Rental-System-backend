import express from 'express';
import {
  getCityDashboard,
  getCityPendingApprovals,
  assignCityToAdmin,
  getAllCitiesForSuperAdmin,
  createNewCity,
  getAdminAssignedCities
} from '../controllers/adminCityController.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

// City-wise Admin Management Routes

// 1. Get City Dashboard (for assigned cities)
router.get('/dashboard', adminAuth, getCityDashboard);

// 2. Get Pending Approvals (city-wise)
router.get('/pending-approvals', adminAuth, getCityPendingApprovals);

// 3. Get Admin's Assigned Cities
router.get('/my-cities', adminAuth, getAdminAssignedCities);

// 4. Super Admin Only Routes
router.get('/all-cities', adminAuth, getAllCitiesForSuperAdmin);
router.post('/assign-city', adminAuth, assignCityToAdmin);
router.post('/create-city', adminAuth, createNewCity);

export default router;
