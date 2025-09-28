import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import {
  getDashboardStats,
  getRecentActivity,
  getUserBookings,
  getUserFavorites,
  getUserProfile,
  updateUserProfile,
  getUserAnalytics
} from '../controllers/userDashboardController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Dashboard Overview Routes
router.get('/stats', getDashboardStats);
router.get('/activity', getRecentActivity);
router.get('/analytics', getUserAnalytics);

// Booking Management Routes
router.get('/bookings', getUserBookings);

// Favorites Routes
router.get('/favorites', getUserFavorites);

// Profile Management Routes
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

export default router;