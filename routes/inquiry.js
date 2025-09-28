import express from 'express';
import {
  submitInquiry,
  getAdminInquiries,
  respondToInquiry,
  scheduleVisit,
  updateInquiryStatus,
  getInquiryDetails
} from '../controllers/inquiryController.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

// User Inquiry System Routes

// 1. Public route - Submit inquiry (no auth required)
router.post('/submit', submitInquiry);

// 2. Admin routes (require admin authentication)
router.get('/admin/list', adminAuth, getAdminInquiries);
router.get('/admin/:inquiryId', adminAuth, getInquiryDetails);
router.post('/admin/:inquiryId/respond', adminAuth, respondToInquiry);
router.post('/admin/:inquiryId/schedule-visit', adminAuth, scheduleVisit);
router.patch('/admin/:inquiryId/status', adminAuth, updateInquiryStatus);

export default router;
