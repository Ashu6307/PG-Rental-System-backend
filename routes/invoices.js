import express from 'express';
import { body } from 'express-validator';
import { authenticateJWT, authorize } from '../middleware/auth.js';
import * as invoiceController from '../controllers/invoiceController.js';

const router = express.Router();

// Validation middleware
const validateInvoice = [
  body('tenantId').notEmpty().withMessage('Tenant ID is required'),
  body('roomId').notEmpty().withMessage('Room ID is required'),
  body('pgId').notEmpty().withMessage('PG ID is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date'),
  body('invoiceType').optional().isIn(['monthly_rent', 'security_deposit', 'maintenance', 'utilities', 'other']).withMessage('Invalid invoice type'),
  body('items').optional().isArray().withMessage('Items must be an array'),
  body('taxAmount').optional().isNumeric().withMessage('Tax amount must be a number'),
  body('discountAmount').optional().isNumeric().withMessage('Discount amount must be a number')
];

const validatePayment = [
  body('paymentMethod').optional().isIn(['cash', 'bank_transfer', 'upi', 'card', 'cheque']).withMessage('Invalid payment method'),
  body('transactionId').optional().notEmpty().withMessage('Transaction ID cannot be empty'),
  body('paymentDate').optional().isISO8601().withMessage('Payment date must be a valid date')
];

// Routes

// @route   POST /api/invoices
// @desc    Create a new invoice
// @access  Private (Owner, Admin)
router.post('/', 
  authenticateJWT, 
  authorize('owner', 'admin'), 
  validateInvoice, 
  invoiceController.createInvoice
);

// @route   GET /api/invoices
// @desc    Get all invoices with filtering and pagination
// @access  Private (All authenticated users)
router.get('/', 
  authenticateJWT, 
  invoiceController.getAllInvoices
);

// @route   GET /api/invoices/stats
// @desc    Get invoice statistics
// @access  Private (Owner, Admin)
router.get('/stats', 
  authenticateJWT, 
  authorize('owner', 'admin'), 
  invoiceController.getInvoiceStats
);

// @route   GET /api/invoices/:id
// @desc    Get invoice by ID
// @access  Private (Owner, Admin, Tenant - own invoices only)
router.get('/:id', 
  authenticateJWT, 
  invoiceController.getInvoiceById
);

// @route   PUT /api/invoices/:id
// @desc    Update invoice
// @access  Private (Owner, Admin)
router.put('/:id', 
  authenticateJWT, 
  authorize('owner', 'admin'), 
  invoiceController.updateInvoice
);

// @route   DELETE /api/invoices/:id
// @desc    Delete invoice
// @access  Private (Owner, Admin)
router.delete('/:id', 
  authenticateJWT, 
  authorize('owner', 'admin'), 
  invoiceController.deleteInvoice
);

// @route   PATCH /api/invoices/:id/mark-paid
// @desc    Mark invoice as paid
// @access  Private (Owner, Admin)
router.patch('/:id/mark-paid', 
  authenticateJWT, 
  authorize('owner', 'admin'), 
  validatePayment,
  invoiceController.markAsPaid
);

// @route   GET /api/invoices/:id/pdf
// @desc    Generate and download invoice PDF
// @access  Private (Owner, Admin, Tenant - own invoices only)
router.get('/:id/pdf', 
  authenticateJWT, 
  invoiceController.generateInvoicePDF
);

// @route   POST /api/invoices/:id/send-email
// @desc    Send invoice via email
// @access  Private (Owner, Admin)
router.post('/:id/send-email', 
  authenticateJWT, 
  authorize('owner', 'admin'),
  body('customMessage').optional().isLength({ max: 500 }).withMessage('Custom message too long'),
  invoiceController.sendInvoiceEmail
);

export default router;
