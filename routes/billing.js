import express from 'express';
import { body, param, query } from 'express-validator';
import {
  getBillingDashboard,
  generateManualBilling,
  updateBillingPreferences,
  getBillingHistory,
  getBillingAnalytics,
  handleLifecycleChange,
  getSchedulerStatus,
  triggerSchedulerJob,
  updateNextBillingDate
} from '../controllers/billingController.js';
import { authenticateJWT, ownerAuth } from '../middleware/auth.js';
import PGResident from '../models/PGResident.js';
import Invoice from '../models/Invoice.js';
import { calculateAnniversaryBilling } from '../services/billingService.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateJWT);

// Billing Dashboard - Overview of billing status, upcoming bills, etc.
router.get('/dashboard', ownerAuth, getBillingDashboard);

// Billing Analytics - Revenue, collection efficiency, trends
router.get('/analytics', 
  ownerAuth,
  [
    query('period').optional().isInt({ min: 1, max: 60 }).withMessage('Period must be between 1-60 months'),
    query('groupBy').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Invalid groupBy value')
  ],
  getBillingAnalytics
);

// Manual Billing Generation
router.post('/residents/:residentId/generate',
  ownerAuth,
  [
    param('residentId').isMongoId().withMessage('Invalid resident ID'),
    body('billingType').isIn(['anniversary', 'custom', 'prorated']).withMessage('Invalid billing type'),
    body('customAmount').optional().isNumeric().withMessage('Custom amount must be numeric'),
    body('description').optional().trim().isLength({ min: 1, max: 500 }).withMessage('Description must be 1-500 characters'),
    body('dueDate').optional().isISO8601().withMessage('Invalid due date format'),
    body('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    body('endDate').optional().isISO8601().withMessage('Invalid end date format')
  ],
  generateManualBilling
);

// Update Billing Preferences for a Resident
router.put('/residents/:residentId/preferences',
  ownerAuth,
  [
    param('residentId').isMongoId().withMessage('Invalid resident ID'),
    body('billingPreferences.autoGenerate').optional().isBoolean().withMessage('autoGenerate must be boolean'),
    body('billingPreferences.reminderDays').optional().isInt({ min: 0, max: 30 }).withMessage('reminderDays must be 0-30'),
    body('billingPreferences.gracePeriod').optional().isInt({ min: 0, max: 30 }).withMessage('gracePeriod must be 0-30'),
    body('billingPreferences.emailReminders').optional().isBoolean().withMessage('emailReminders must be boolean'),
    body('billingPreferences.smsReminders').optional().isBoolean().withMessage('smsReminders must be boolean'),
    body('billingPreferences.whatsappReminders').optional().isBoolean().withMessage('whatsappReminders must be boolean'),
    body('proration.enableProration').optional().isBoolean().withMessage('enableProration must be boolean'),
    body('proration.prorationType').optional().isIn(['daily', 'weekly']).withMessage('Invalid proration type')
  ],
  updateBillingPreferences
);

// Get Billing History for a Resident
router.get('/residents/:residentId/history',
  ownerAuth,
  [
    param('residentId').isMongoId().withMessage('Invalid resident ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    query('status').optional().isIn(['pending', 'paid', 'overdue', 'cancelled']).withMessage('Invalid status'),
    query('type').optional().isIn(['rent', 'electricity', 'common_charges', 'security_deposit', 'other']).withMessage('Invalid type'),
    query('fromDate').optional().isISO8601().withMessage('Invalid fromDate format'),
    query('toDate').optional().isISO8601().withMessage('Invalid toDate format')
  ],
  getBillingHistory
);

// Handle Lifecycle Changes (Check-in/Check-out with prorated billing)
router.post('/residents/:residentId/lifecycle',
  ownerAuth,
  [
    param('residentId').isMongoId().withMessage('Invalid resident ID'),
    body('action').isIn(['checkin', 'checkout']).withMessage('Action must be checkin or checkout'),
    body('actionDate').optional().isISO8601().withMessage('Invalid action date format'),
    body('generateBilling').optional().isBoolean().withMessage('generateBilling must be boolean')
  ],
  handleLifecycleChange
);

// Update Next Billing Date
router.put('/residents/:residentId/next-billing-date',
  ownerAuth,
  [
    param('residentId').isMongoId().withMessage('Invalid resident ID'),
    body('nextBillingDate').isISO8601().withMessage('Invalid next billing date format')
  ],
  updateNextBillingDate
);

// Scheduler Management Routes (Admin only)
router.get('/scheduler/status', ownerAuth, getSchedulerStatus);

router.post('/scheduler/trigger/:jobName',
  ownerAuth,
  [
    param('jobName').isIn(['billing-check', 'payment-reminders', 'monthly-billing', 'overdue-check'])
      .withMessage('Invalid job name'),
    body('force').optional().isBoolean().withMessage('force must be boolean')
  ],
  triggerSchedulerJob
);

// Bulk Operations Routes

// Get all residents with billing status
router.get('/residents/status',
  ownerAuth,
  [
    query('status').optional().isIn(['active', 'checkout', 'terminated', 'notice-period']).withMessage('Invalid status'),
    query('billingStatus').optional().isIn(['current', 'due_soon', 'overdue', 'not_set']).withMessage('Invalid billing status'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100')
  ],
  async (req, res) => {
    try {
      const { status, billingStatus, page = 1, limit = 20 } = req.query;
      const { ownerId } = req.user;

      const query = { owner: ownerId };
      if (status) query.status = status;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const residents = await PGResident.find(query)
        .populate('pg', 'pg_name')
        .populate('room', 'room_number type')
        .select('name email phone checkinDate rentAmount nextBillingDate billingPreferences status')
        .sort({ nextBillingDate: 1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Filter by billing status if specified
      const filteredResidents = billingStatus ? 
        residents.filter(resident => resident.billingStatus === billingStatus) : 
        residents;

      const residentsWithStatus = filteredResidents.map(resident => ({
        ...resident.toJSON(),
        billingStatus: resident.billingStatus,
        daysUntilBilling: resident.getDaysUntilBilling(),
        outstandingAmount: resident.outstandingAmount
      }));

      const totalCount = await PGResident.countDocuments(query);

      res.json({
        success: true,
        data: {
          residents: residentsWithStatus,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount / parseInt(limit)),
            totalCount,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error getting residents status:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching residents status',
        error: error.message
      });
    }
  }
);

// Bulk billing generation
router.post('/bulk/generate',
  ownerAuth,
  [
    body('residentIds').isArray({ min: 1 }).withMessage('residentIds must be a non-empty array'),
    body('residentIds.*').isMongoId().withMessage('Each resident ID must be valid'),
    body('billingType').isIn(['anniversary', 'custom', 'prorated']).withMessage('Invalid billing type'),
    body('customAmount').optional().isNumeric().withMessage('Custom amount must be numeric'),
    body('description').optional().trim().isLength({ min: 1, max: 500 }).withMessage('Description must be 1-500 characters')
  ],
  async (req, res) => {
    try {
      const { residentIds, billingType, customAmount, description } = req.body;
      const { ownerId } = req.user;

      const results = [];
      const errors = [];

      for (const residentId of residentIds) {
        try {
          const resident = await PGResident.findOne({ 
            _id: residentId, 
            owner: ownerId 
          }).populate('pg room');

          if (!resident) {
            errors.push({
              residentId,
              error: 'Resident not found or unauthorized'
            });
            continue;
          }

          // Generate billing based on type
          let billingData;
          if (billingType === 'anniversary') {
            billingData = await calculateAnniversaryBilling(resident);
          } else if (billingType === 'custom') {
            billingData = {
              totalAmount: customAmount,
              items: [{
                description: description || 'Bulk custom billing',
                amount: customAmount,
                type: 'other'
              }],
              billingPeriod: {
                start: new Date(),
                end: new Date()
              },
              dueDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000))
            };
          }

          // Create invoice
          const invoiceData = {
            tenantId: resident._id,
            ownerId: req.user._id,
            roomId: resident.room,
            pgId: resident.pg,
            type: billingType === 'custom' ? 'other' : 'rent',
            amount: billingData.totalAmount,
            description: description || billingData.items[0]?.description || 'Bulk billing',
            dueDate: billingData.dueDate,
            billingPeriod: billingData.billingPeriod,
            items: billingData.items,
            metadata: {
              ...billingData.metadata,
              isBulkGenerated: true,
              generatedBy: req.user._id,
              billingType
            }
          };

          const invoice = new Invoice(invoiceData);
          await invoice.save();

          // Update resident's billing history
          resident.addBillingRecord({
            invoiceId: invoice._id,
            amount: invoice.amount,
            billingDate: new Date(),
            type: invoice.type,
            notes: 'Bulk generated'
          });
          await resident.save();

          results.push({
            residentId,
            residentName: resident.name,
            invoiceId: invoice._id,
            amount: invoice.amount,
            success: true
          });

        } catch (error) {
          errors.push({
            residentId,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        message: `Bulk billing completed. ${results.length} successful, ${errors.length} failed.`,
        data: {
          successful: results,
          failed: errors,
          summary: {
            total: residentIds.length,
            successful: results.length,
            failed: errors.length,
            totalAmount: results.reduce((sum, result) => sum + result.amount, 0)
          }
        }
      });

    } catch (error) {
      console.error('Error in bulk billing generation:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating bulk billing',
        error: error.message
      });
    }
  }
);

// Export billing data
router.get('/export',
  [
    query('format').optional().isIn(['csv', 'excel', 'pdf']).withMessage('Invalid export format'),
    query('fromDate').optional().isISO8601().withMessage('Invalid fromDate format'),
    query('toDate').optional().isISO8601().withMessage('Invalid toDate format'),
    query('status').optional().isIn(['pending', 'paid', 'overdue', 'cancelled']).withMessage('Invalid status'),
    query('type').optional().isIn(['rent', 'electricity', 'common_charges', 'security_deposit', 'other']).withMessage('Invalid type')
  ],
  async (req, res) => {
    try {
      const { format = 'csv', fromDate, toDate, status, type } = req.query;
      const { ownerId } = req.user;

      // Build query
      const query = { ownerId };
      if (fromDate || toDate) {
        query.createdAt = {};
        if (fromDate) query.createdAt.$gte = new Date(fromDate);
        if (toDate) query.createdAt.$lte = new Date(toDate);
      }
      if (status) query.status = status;
      if (type) query.type = type;

      const invoices = await Invoice.find(query)
        .populate('tenantId', 'name email phone')
        .populate('pgId', 'pg_name')
        .populate('roomId', 'room_number')
        .sort({ createdAt: -1 });

      // Format data for export
      const exportData = invoices.map(invoice => ({
        'Invoice Number': invoice.invoiceNumber,
        'Tenant Name': invoice.tenantId?.name || 'N/A',
        'PG Name': invoice.pgId?.pg_name || 'N/A',
        'Room Number': invoice.roomId?.room_number || 'N/A',
        'Type': invoice.type,
        'Amount': invoice.amount,
        'Status': invoice.status,
        'Due Date': invoice.dueDate?.toDateString() || 'N/A',
        'Created Date': invoice.createdAt.toDateString(),
        'Description': invoice.description || 'N/A'
      }));

      if (format === 'csv') {
        // For CSV export (you'd need to implement CSV generation)
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=billing-export.csv');
        
        // Simple CSV generation (in production, use a proper CSV library)
        const headers = Object.keys(exportData[0] || {}).join(',');
        const rows = exportData.map(row => Object.values(row).join(',')).join('\n');
        const csv = headers + '\n' + rows;
        
        res.send(csv);
      } else {
        // For now, return JSON data
        res.json({
          success: true,
          data: exportData,
          summary: {
            totalRecords: exportData.length,
            exportFormat: format,
            generatedAt: new Date()
          }
        });
      }

    } catch (error) {
      console.error('Error exporting billing data:', error);
      res.status(500).json({
        success: false,
        message: 'Error exporting billing data',
        error: error.message
      });
    }
  }
);

export default router;