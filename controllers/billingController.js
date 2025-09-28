import { validationResult } from 'express-validator';
import PGResident from '../models/PGResident.js';
import Invoice from '../models/Invoice.js';
import {
  calculateAnniversaryBilling,
  calculateProratedAmount,
  calculateNextBillingDate,
  calculateBillingSummary,
  handleMidMonthBilling
} from '../services/billingService.js';
import billingScheduler from '../services/billingScheduler.js';

// Get billing dashboard overview
export const getBillingDashboard = async (req, res) => {
  try {
    const ownerId = req.user._id; // Fix: use _id instead of ownerId
    const { period = '30' } = req.query; // days

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(period));

    // Get active residents count
    const activeResidents = await PGResident.countDocuments({
      owner: ownerId,
      status: 'active'
    });

    // Get upcoming bills (next 7 days)
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + 7);

    const upcomingBills = await PGResident.find({
      owner: ownerId,
      status: 'active',
      nextBillingDate: { $lte: upcomingDate }
    }).populate('pg room').select('name nextBillingDate rentAmount pg room');

    // Get overdue invoices
    const overdueInvoices = await Invoice.find({
      ownerId,
      status: 'pending',
      dueDate: { $lt: new Date() }
    }).populate('tenantId', 'name').select('invoiceNumber amount dueDate tenantId');

    // Calculate revenue statistics
    const revenueStats = await Invoice.aggregate([
      {
        $match: {
          ownerId: req.user._id,
          createdAt: { $gte: fromDate }
        }
      },
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent billing activities
    const recentActivities = await Invoice.find({
      ownerId,
      createdAt: { $gte: fromDate }
    })
      .populate('tenantId', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('invoiceNumber amount status type createdAt tenantId');

    const dashboard = {
      overview: {
        activeResidents,
        upcomingBillsCount: upcomingBills.length,
        overdueInvoicesCount: overdueInvoices.length,
        totalRevenue: revenueStats.reduce((sum, stat) => sum + stat.totalAmount, 0)
      },
      upcomingBills: upcomingBills.map(resident => ({
        residentId: resident._id,
        name: resident.name,
        pgName: resident.pg?.pg_name,
        roomNumber: resident.room?.room_number,
        nextBillingDate: resident.nextBillingDate,
        rentAmount: resident.rentAmount,
        daysUntilBilling: resident.getDaysUntilBilling()
      })),
      overdueInvoices: overdueInvoices.map(invoice => ({
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        tenantName: invoice.tenantId?.name,
        amount: invoice.amount,
        dueDate: invoice.dueDate,
        daysPastDue: Math.ceil((new Date() - invoice.dueDate) / (1000 * 60 * 60 * 24))
      })),
      revenueStats: revenueStats.reduce((acc, stat) => {
        acc[stat._id] = {
          amount: stat.totalAmount,
          count: stat.count
        };
        return acc;
      }, {}),
      recentActivities: recentActivities.map(activity => ({
        invoiceId: activity._id,
        invoiceNumber: activity.invoiceNumber,
        tenantName: activity.tenantId?.name,
        amount: activity.amount,
        status: activity.status,
        type: activity.type,
        date: activity.createdAt
      }))
    };

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error getting billing dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching billing dashboard',
      error: error.message
    });
  }
};

// Generate manual billing for a resident
export const generateManualBilling = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { residentId } = req.params;
    const { billingType = 'anniversary', customAmount, description, dueDate } = req.body;

    const resident = await PGResident.findById(residentId).populate('pg room');
    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found'
      });
    }

    // Check if user owns this resident
    if (resident.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    let billingData;

    if (billingType === 'anniversary') {
      billingData = await calculateAnniversaryBilling(resident);
    } else if (billingType === 'custom') {
      billingData = {
        totalAmount: customAmount,
        items: [{
          description: description || 'Custom billing',
          amount: customAmount,
          type: 'other'
        }],
        billingPeriod: {
          start: new Date(),
          end: new Date()
        },
        dueDate: new Date(dueDate || Date.now() + (7 * 24 * 60 * 60 * 1000))
      };
    } else if (billingType === 'prorated') {
      const { startDate, endDate } = req.body;
      billingData = calculateProratedAmount(resident, new Date(startDate), new Date(endDate));
    }

    // Create invoice
    const invoiceData = {
      tenantId: resident._id,
      ownerId: req.user._id,
      roomId: resident.room,
      pgId: resident.pg,
      type: billingType === 'custom' ? 'other' : 'rent',
      amount: billingData.totalAmount,
      description: description || billingData.items[0]?.description || 'Manual billing',
      dueDate: billingData.dueDate,
      billingPeriod: billingData.billingPeriod,
      items: billingData.items,
      metadata: {
        ...billingData.metadata,
        isManuallyGenerated: true,
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
      notes: 'Manually generated'
    });
    await resident.save();

    res.status(201).json({
      success: true,
      message: 'Manual billing generated successfully',
      data: {
        invoice,
        billingData
      }
    });
  } catch (error) {
    console.error('Error generating manual billing:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating manual billing',
      error: error.message
    });
  }
};

// Update billing preferences for a resident
export const updateBillingPreferences = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { residentId } = req.params;
    const { billingPreferences, proration } = req.body;

    const resident = await PGResident.findById(residentId);
    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found'
      });
    }

    // Check if user owns this resident
    if (resident.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Update preferences
    if (billingPreferences) {
      resident.billingPreferences = { ...resident.billingPreferences, ...billingPreferences };
    }

    if (proration) {
      resident.proration = { ...resident.proration, ...proration };
    }

    await resident.save();

    res.json({
      success: true,
      message: 'Billing preferences updated successfully',
      data: {
        billingPreferences: resident.billingPreferences,
        proration: resident.proration
      }
    });
  } catch (error) {
    console.error('Error updating billing preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating billing preferences',
      error: error.message
    });
  }
};

// Get billing history for a resident
export const getBillingHistory = async (req, res) => {
  try {
    const { residentId } = req.params;
    const { page = 1, limit = 10, status, type, fromDate, toDate } = req.query;

    const resident = await PGResident.findById(residentId);
    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found'
      });
    }

    // Check if user owns this resident
    if (resident.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Build query for invoices
    const query = { tenantId: residentId };
    
    if (status) query.status = status;
    if (type) query.type = type;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [invoices, totalCount] = await Promise.all([
      Invoice.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('paymentId', 'amount paymentDate method'),
      Invoice.countDocuments(query)
    ]);

    // Calculate summary
    const summary = await calculateBillingSummary(
      residentId,
      fromDate ? new Date(fromDate) : new Date(Date.now() - (365 * 24 * 60 * 60 * 1000)),
      toDate ? new Date(toDate) : new Date()
    );

    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          limit: parseInt(limit)
        },
        summary,
        resident: {
          name: resident.name,
          roomNumber: resident.room?.room_number,
          pgName: resident.pg?.pg_name,
          nextBillingDate: resident.nextBillingDate,
          billingStatus: resident.billingStatus
        }
      }
    });
  } catch (error) {
    console.error('Error getting billing history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching billing history',
      error: error.message
    });
  }
};

// Get billing analytics
export const getBillingAnalytics = async (req, res) => {
  try {
    const { period = '12' } = req.query; // months

    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - parseInt(period));

    // Revenue analytics
    const revenueAnalytics = await Invoice.aggregate([
      {
        $match: {
          ownerId: req.user._id,
          createdAt: { $gte: fromDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            status: '$status'
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Collection efficiency
    const collectionStats = await Invoice.aggregate([
      {
        $match: {
          ownerId: req.user._id,
          createdAt: { $gte: fromDate }
        }
      },
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);

    // Top paying tenants
    const topPayingTenants = await Invoice.aggregate([
      {
        $match: {
          ownerId: req.user._id,
          status: 'paid',
          createdAt: { $gte: fromDate }
        }
      },
      {
        $group: {
          _id: '$tenantId',
          totalPaid: { $sum: '$amount' },
          invoiceCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalPaid: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'pgresidents',
          localField: '_id',
          foreignField: '_id',
          as: 'tenant'
        }
      },
      {
        $unwind: '$tenant'
      }
    ]);

    // Billing type breakdown
    const billingTypeStats = await Invoice.aggregate([
      {
        $match: {
          ownerId: req.user._id,
          createdAt: { $gte: fromDate }
        }
      },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Overdue analysis
    const overdueAnalysis = await Invoice.aggregate([
      {
        $match: {
          ownerId: req.user._id,
          status: 'pending',
          dueDate: { $lt: new Date() }
        }
      },
      {
        $group: {
          _id: {
            daysOverdue: {
              $switch: {
                branches: [
                  { case: { $lte: [{ $divide: [{ $subtract: [new Date(), '$dueDate'] }, 86400000] }, 7] }, then: '1-7 days' },
                  { case: { $lte: [{ $divide: [{ $subtract: [new Date(), '$dueDate'] }, 86400000] }, 30] }, then: '8-30 days' },
                  { case: { $lte: [{ $divide: [{ $subtract: [new Date(), '$dueDate'] }, 86400000] }, 90] }, then: '31-90 days' }
                ],
                default: '90+ days'
              }
            }
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        revenueAnalytics,
        collectionStats: collectionStats.reduce((acc, stat) => {
          acc[stat._id] = {
            amount: stat.totalAmount,
            count: stat.count,
            avgAmount: Math.round(stat.avgAmount)
          };
          return acc;
        }, {}),
        topPayingTenants: topPayingTenants.map(tenant => ({
          tenantId: tenant._id,
          name: tenant.tenant.name,
          totalPaid: tenant.totalPaid,
          invoiceCount: tenant.invoiceCount,
          avgPayment: Math.round(tenant.totalPaid / tenant.invoiceCount)
        })),
        billingTypeStats: billingTypeStats.reduce((acc, stat) => {
          acc[stat._id] = {
            amount: stat.totalAmount,
            count: stat.count
          };
          return acc;
        }, {}),
        overdueAnalysis: overdueAnalysis.reduce((acc, analysis) => {
          acc[analysis._id.daysOverdue] = {
            amount: analysis.totalAmount,
            count: analysis.count
          };
          return acc;
        }, {}),
        period: `${period} months`
      }
    });
  } catch (error) {
    console.error('Error getting billing analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching billing analytics',
      error: error.message
    });
  }
};

// Handle mid-month lifecycle changes
export const handleLifecycleChange = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { residentId } = req.params;
    const { action, actionDate, generateBilling = true } = req.body;

    const resident = await PGResident.findById(residentId).populate('pg room');
    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found'
      });
    }

    // Check if user owns this resident
    if (resident.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const changeDate = new Date(actionDate || Date.now());
    let billingData = null;
    let invoice = null;

    if (generateBilling) {
      billingData = await handleMidMonthBilling(resident, action, changeDate);
      
      // Create invoice for the prorated amount
      if (billingData.totalAmount > 0) {
        const invoiceData = {
          tenantId: resident._id,
          ownerId: req.user._id,
          roomId: resident.room,
          pgId: resident.pg,
          type: 'rent',
          amount: billingData.totalAmount,
          description: billingData.description,
          dueDate: new Date(changeDate.getTime() + (3 * 24 * 60 * 60 * 1000)), // 3 days from action date
          billingPeriod: billingData.billingPeriod,
          items: billingData.items,
          metadata: billingData.metadata
        };

        invoice = new Invoice(invoiceData);
        await invoice.save();

        // Update resident's billing history
        resident.addBillingRecord({
          invoiceId: invoice._id,
          amount: invoice.amount,
          billingDate: changeDate,
          type: invoice.type,
          notes: `${action.charAt(0).toUpperCase() + action.slice(1)} lifecycle change`
        });
      }
    }

    // Update resident status and dates
    if (action === 'checkout') {
      resident.status = 'checkout';
      resident.checkoutDate = changeDate;
      resident.nextBillingDate = null; // Stop future billing
    } else if (action === 'checkin') {
      resident.status = 'active';
      resident.checkinDate = changeDate;
      resident.nextBillingDate = calculateNextBillingDate(resident);
    }

    await resident.save();

    res.json({
      success: true,
      message: `${action.charAt(0).toUpperCase() + action.slice(1)} processed successfully`,
      data: {
        resident: {
          status: resident.status,
          checkinDate: resident.checkinDate,
          checkoutDate: resident.checkoutDate,
          nextBillingDate: resident.nextBillingDate
        },
        billingData,
        invoice
      }
    });
  } catch (error) {
    console.error('Error handling lifecycle change:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing lifecycle change',
      error: error.message
    });
  }
};

// Scheduler management endpoints
export const getSchedulerStatus = async (req, res) => {
  try {
    const status = billingScheduler.getJobStatus();
    
    res.json({
      success: true,
      data: {
        initialized: billingScheduler.isInitialized,
        jobs: status
      }
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching scheduler status',
      error: error.message
    });
  }
};

export const triggerSchedulerJob = async (req, res) => {
  try {
    const { jobName } = req.params;
    const { force = false } = req.body;

    // Only allow admin to trigger jobs
    if (req.user.role !== 'admin' && !force) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can trigger scheduler jobs'
      });
    }

    await billingScheduler.triggerJob(jobName);
    
    res.json({
      success: true,
      message: `Job ${jobName} triggered successfully`
    });
  } catch (error) {
    console.error('Error triggering scheduler job:', error);
    res.status(500).json({
      success: false,
      message: 'Error triggering scheduler job',
      error: error.message
    });
  }
};

// Update next billing date for a resident
export const updateNextBillingDate = async (req, res) => {
  try {
    const { residentId } = req.params;
    const { nextBillingDate } = req.body;

    const resident = await PGResident.findById(residentId);
    if (!resident) {
      return res.status(404).json({
        success: false,
        message: 'Resident not found'
      });
    }

    // Check if user owns this resident
    if (resident.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    resident.nextBillingDate = new Date(nextBillingDate);
    await resident.save();

    res.json({
      success: true,
      message: 'Next billing date updated successfully',
      data: {
        nextBillingDate: resident.nextBillingDate,
        daysUntilBilling: resident.getDaysUntilBilling()
      }
    });
  } catch (error) {
    console.error('Error updating next billing date:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating next billing date',
      error: error.message
    });
  }
};

export default {
  getBillingDashboard,
  generateManualBilling,
  updateBillingPreferences,
  getBillingHistory,
  getBillingAnalytics,
  handleLifecycleChange,
  getSchedulerStatus,
  triggerSchedulerJob,
  updateNextBillingDate
};