import Invoice from '../models/Invoice.js';
import Tenant from '../models/Tenant.js';
import Room from '../models/Room.js';
import PG from '../models/PG.js';
import * as invoiceService from '../utils/invoiceService.js';
import { validationResult } from 'express-validator';

// Create new invoice
const createInvoice = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      tenantId,
      roomId,
      pgId,
      amount,
      dueDate,
      description,
      invoiceType,
      items,
      taxAmount,
      discountAmount,
      securityDeposit
    } = req.body;

    // Verify tenant exists
    const tenant = await Tenant.findById(tenantId).populate('userId');
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Verify room exists
    const room = await Room.findById(roomId).populate('pgId');
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Verify PG exists
    const pg = await PG.findById(pgId).populate('ownerId');
    if (!pg) {
      return res.status(404).json({
        success: false,
        message: 'PG not found'
      });
    }

    // Generate invoice number
    const invoiceNumber = await invoiceService.generateInvoiceNumber();

    // Calculate total amount
    const subtotal = amount || 0;
    const tax = taxAmount || 0;
    const discount = discountAmount || 0;
    const totalAmount = subtotal + tax - discount;

    // Create invoice
    const invoice = new Invoice({
      invoiceNumber,
      tenantId,
      roomId,
      pgId,
      ownerId: pg.ownerId._id,
      amount: subtotal,
      taxAmount: tax,
      discountAmount: discount,
      totalAmount,
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      description: description || `Rent for ${room.roomNumber} - ${pg.name}`,
      invoiceType: invoiceType || 'monthly_rent',
      items: items || [{
        description: `Monthly rent for Room ${room.roomNumber}`,
        quantity: 1,
        rate: amount,
        amount: amount
      }],
      securityDeposit: securityDeposit || 0,
      status: 'pending',
      createdBy: req.user.id
    });

    await invoice.save();

    // Populate the response
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('tenantId', 'userId bookingId')
      .populate('roomId', 'roomNumber rent')
      .populate('pgId', 'name address')
      .populate('ownerId', 'name email phone')
      .populate({
        path: 'tenantId',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      });

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: populatedInvoice
    });

  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating invoice',
      error: error.message
    });
  }
};

// Get all invoices with filtering and pagination
const getAllInvoices = async (req, res) => {
  try {
    // Get pagination defaults from environment variables
    const defaultPage = parseInt(process.env.DEFAULT_PAGE) || 1;
    const defaultLimit = parseInt(process.env.DEFAULT_PAGE_LIMIT) || 10;
    
    const {
      page = defaultPage,
      limit = defaultLimit,
      status,
      invoiceType,
      tenantId,
      pgId,
      ownerId,
      startDate,
      endDate,
      search
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    let filter = {};

    if (status) filter.status = status;
    if (invoiceType) filter.invoiceType = invoiceType;
    if (tenantId) filter.tenantId = tenantId;
    if (pgId) filter.pgId = pgId;
    if (ownerId) filter.ownerId = ownerId;

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Search in invoice number or description
    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Role-based filtering
    if (req.user.role === 'owner') {
      filter.ownerId = req.user.id;
    } else if (req.user.role === 'tenant') {
      const tenant = await Tenant.findOne({ userId: req.user.id });
      if (tenant) {
        filter.tenantId = tenant._id;
      }
    }

    const invoices = await Invoice.find(filter)
      .populate('tenantId', 'userId bookingId')
      .populate('roomId', 'roomNumber rent')
      .populate('pgId', 'name address')
      .populate('ownerId', 'name email phone')
      .populate({
        path: 'tenantId',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Invoice.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    // Calculate summary statistics
    const stats = await Invoice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'paid'] }, '$totalAmount', 0]
            }
          },
          pendingAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$totalAmount', 0]
            }
          },
          overdueAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'overdue'] }, '$totalAmount', 0]
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: invoices,
      pagination: {
        current: pageNum,
        total: totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
        totalRecords: total
      },
      stats: stats[0] || {
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0
      }
    });

  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoices',
      error: error.message
    });
  }
};

// Get single invoice by ID
const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id)
      .populate('tenantId', 'userId bookingId')
      .populate('roomId', 'roomNumber rent facilities')
      .populate('pgId', 'name address contact')
      .populate('ownerId', 'name email phone')
      .populate({
        path: 'tenantId',
        populate: {
          path: 'userId',
          select: 'name email phone address'
        }
      });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check authorization
    if (req.user.role === 'owner' && invoice.ownerId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (req.user.role === 'tenant') {
      const tenant = await Tenant.findOne({ userId: req.user.id });
      if (!tenant || invoice.tenantId._id.toString() !== tenant._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: invoice
    });

  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice',
      error: error.message
    });
  }
};

// Update invoice
const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check authorization (only owner or admin can update)
    if (req.user.role === 'owner' && invoice.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Prevent updating certain fields if invoice is paid
    if (invoice.status === 'paid' && (updateData.amount || updateData.totalAmount)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update amount for paid invoices'
      });
    }

    // Recalculate total if amounts are updated
    if (updateData.amount || updateData.taxAmount || updateData.discountAmount) {
      const amount = updateData.amount || invoice.amount;
      const taxAmount = updateData.taxAmount || invoice.taxAmount;
      const discountAmount = updateData.discountAmount || invoice.discountAmount;
      updateData.totalAmount = amount + taxAmount - discountAmount;
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id,
      { ...updateData, updatedBy: req.user.id },
      { new: true, runValidators: true }
    ).populate('tenantId roomId pgId ownerId');

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: updatedInvoice
    });

  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating invoice',
      error: error.message
    });
  }
};

// Delete invoice
const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check authorization (only owner or admin can delete)
    if (req.user.role === 'owner' && invoice.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Prevent deleting paid invoices
    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete paid invoices'
      });
    }

    await Invoice.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting invoice',
      error: error.message
    });
  }
};

// Mark invoice as paid
const markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, transactionId, paymentDate, notes } = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is already paid'
      });
    }

    const updateData = {
      status: 'paid',
      paymentDate: paymentDate || new Date(),
      paymentMethod: paymentMethod || 'cash',
      transactionId,
      notes,
      updatedBy: req.user.id
    };

    const updatedInvoice = await Invoice.findByIdAndUpdate(id, updateData, { new: true })
      .populate('tenantId roomId pgId ownerId');

    res.status(200).json({
      success: true,
      message: 'Invoice marked as paid successfully',
      data: updatedInvoice
    });

  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking invoice as paid',
      error: error.message
    });
  }
};

// Generate and send invoice PDF
const generateInvoicePDF = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id)
      .populate('tenantId roomId pgId ownerId')
      .populate({
        path: 'tenantId',
        populate: {
          path: 'userId',
          select: 'name email phone address'
        }
      });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Generate PDF
    const pdfBuffer = await invoiceService.generatePDF(invoice);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating invoice PDF',
      error: error.message
    });
  }
};

// Send invoice via email
const sendInvoiceEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { customMessage } = req.body;

    const invoice = await Invoice.findById(id)
      .populate('tenantId roomId pgId ownerId')
      .populate({
        path: 'tenantId',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Send email with invoice
    await invoiceService.sendInvoiceEmail(invoice, customMessage);

    res.status(200).json({
      success: true,
      message: 'Invoice sent successfully via email'
    });

  } catch (error) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending invoice email',
      error: error.message
    });
  }
};

// Get invoice statistics
const getInvoiceStats = async (req, res) => {
  try {
    const { startDate, endDate, pgId } = req.query;

    let filter = {};
    
    // Role-based filtering
    if (req.user.role === 'owner') {
      filter.ownerId = req.user.id;
    }

    if (pgId) filter.pgId = pgId;

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const stats = await Invoice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          paidInvoices: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          paidAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$totalAmount', 0] }
          },
          pendingInvoices: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          pendingAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$totalAmount', 0] }
          },
          overdueInvoices: {
            $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] }
          },
          overdueAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, '$totalAmount', 0] }
          }
        }
      }
    ]);

    const monthlyStats = await Invoice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          amount: { $sum: '$totalAmount' },
          paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$totalAmount', 0] } }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {
          totalInvoices: 0,
          totalAmount: 0,
          paidInvoices: 0,
          paidAmount: 0,
          pendingInvoices: 0,
          pendingAmount: 0,
          overdueInvoices: 0,
          overdueAmount: 0
        },
        monthlyTrends: monthlyStats
      }
    });

  } catch (error) {
    console.error('Error fetching invoice statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice statistics',
      error: error.message
    });
  }
};

export {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  markAsPaid,
  generateInvoicePDF,
  sendInvoiceEmail,
  getInvoiceStats
};
