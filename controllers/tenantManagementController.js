import TenantTracking from '../models/TenantTracking.js';
import PG from '../models/PG.js';
import Room from '../models/Room.js';
import Flat from '../models/Flat.js';
import MeterReading from '../models/MeterReading.js';
import ElectricityBill from '../models/ElectricityBill.js';
import { sendEmail } from '../utils/sendEmail.js';

// **COMPLETE TENANT MANAGEMENT SYSTEM FOR OWNER DASHBOARD**

// 1. Get All Tenants for Owner (with advanced filtering)
export const getOwnerTenants = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const {
      status = 'active',
      propertyId,
      roomNumber,
      page = 1,
      limit = 20,
      search,
      sortBy = 'checkInDate',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query
    let query = { owner: ownerId };
    
    if (status !== 'all') {
      if (status === 'active') {
        query['stayDetails.isActive'] = true;
      } else {
        query.status = status;
      }
    }
    
    if (propertyId) query['property.propertyId'] = propertyId;
    if (roomNumber) query['property.roomNumber'] = roomNumber;
    
    // Search functionality
    if (search) {
      query.$or = [
        { 'personalInfo.name': { $regex: search, $options: 'i' } },
        { 'personalInfo.phone': { $regex: search, $options: 'i' } },
        { 'personalInfo.email': { $regex: search, $options: 'i' } },
        { tenantId: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Sort options
    let sort = {};
    if (sortBy === 'checkInDate') {
      sort['stayDetails.checkInDate'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'name') {
      sort['personalInfo.name'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'dues') {
      sort['financials.currentDues.total'] = sortOrder === 'desc' ? -1 : 1;
    }
    
    const tenants = await TenantTracking.find(query)
      .populate('property.propertyId', 'name address city')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalTenants = await TenantTracking.countDocuments(query);
    
    // Get summary statistics
    const summary = await TenantTracking.aggregate([
      { $match: { owner: ownerId } },
      {
        $group: {
          _id: null,
          totalTenants: { $sum: 1 },
          activeTenants: {
            $sum: { $cond: [{ $eq: ['$stayDetails.isActive', true] }, 1, 0] }
          },
          totalDues: { $sum: '$financials.currentDues.total' },
          totalRevenue: { $sum: '$analytics.totalRevenue' },
          averageStay: { $avg: '$analytics.totalStayDays' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        tenants,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalTenants / limit),
          totalTenants,
          limit: parseInt(limit)
        },
        summary: summary[0] || {
          totalTenants: 0,
          activeTenants: 0,
          totalDues: 0,
          totalRevenue: 0,
          averageStay: 0
        }
      }
    });
    
  } catch (error) {
    console.error('Get owner tenants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenants',
      error: error.message
    });
  }
};

// 2. Add New Tenant (Complete Check-in Process)
export const addNewTenant = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const {
      personalInfo,
      property,
      financials,
      documents,
      sharingDetails,
      tenantProfile
    } = req.body;
    
    // Validate required fields
    if (!personalInfo.name || !personalInfo.phone || !property.propertyId || !property.roomNumber) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Check if property belongs to owner
    let propertyDoc;
    if (property.propertyType === 'PG') {
      propertyDoc = await PG.findOne({ _id: property.propertyId, owner: ownerId });
    } else if (property.propertyType === 'Room') {
      propertyDoc = await Room.findOne({ _id: property.propertyId, owner: ownerId });
    } else if (property.propertyType === 'Flat') {
      propertyDoc = await Flat.findOne({ _id: property.propertyId, owner: ownerId });
    }
    
    if (!propertyDoc) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or access denied'
      });
    }
    
    // Check room availability
    const existingTenants = await TenantTracking.find({
      'property.propertyId': property.propertyId,
      'property.roomNumber': property.roomNumber,
      'stayDetails.isActive': true
    });
    
    const maxOccupancy = sharingDetails?.totalBedsInRoom || 1;
    if (existingTenants.length >= maxOccupancy) {
      return res.status(400).json({
        success: false,
        message: 'Room is fully occupied'
      });
    }
    
    // Create new tenant record
    const newTenant = new TenantTracking({
      personalInfo,
      property: {
        ...property,
        propertyName: propertyDoc.name
      },
      owner: ownerId,
      stayDetails: {
        checkInDate: new Date(),
        checkInTime: new Date().toLocaleTimeString(),
        checkInBy: ownerId,
        isActive: true
      },
      financials: {
        monthlyRent: financials.monthlyRent,
        securityDeposit: financials.securityDeposit,
        advanceRent: financials.advanceRent || 0,
        currentDues: {
          rent: 0,
          electricity: 0,
          other: 0,
          total: 0
        }
      },
      documents: documents || {},
      sharingDetails: {
        ...sharingDetails,
        currentOccupancy: existingTenants.length + 1,
        roommates: existingTenants.map(tenant => ({
          tenantId: tenant._id,
          name: tenant.personalInfo.name,
          checkInDate: tenant.stayDetails.checkInDate,
          isActive: true
        }))
      },
      tenantProfile: tenantProfile || {},
      status: 'active'
    });
    
    await newTenant.save();
    
    // Update existing roommates' sharing details
    await TenantTracking.updateMany(
      {
        'property.propertyId': property.propertyId,
        'property.roomNumber': property.roomNumber,
        'stayDetails.isActive': true,
        _id: { $ne: newTenant._id }
      },
      {
        $push: {
          'sharingDetails.roommates': {
            tenantId: newTenant._id,
            name: personalInfo.name,
            checkInDate: new Date(),
            isActive: true
          }
        },
        $inc: { 'sharingDetails.currentOccupancy': 1 }
      }
    );
    
    // Add meter reading for electricity tracking
    if (property.roomNumber) {
      const lastReading = await MeterReading.findOne({
        roomId: property.propertyId,
        roomNumber: property.roomNumber
      }).sort({ createdAt: -1 });
      
      const currentReading = lastReading?.reading || 0;
      
      const meterReading = new MeterReading({
        roomId: property.propertyId,
        roomNumber: property.roomNumber,
        reading: currentReading,
        action: 'tenant_joined',
        activeTenants: existingTenants.length + 1,
        tenantDetails: [{
          tenantId: newTenant._id,
          name: personalInfo.name,
          joinDate: new Date(),
          isActive: true
        }, ...existingTenants.map(t => ({
          tenantId: t._id,
          name: t.personalInfo.name,
          joinDate: t.stayDetails.checkInDate,
          isActive: true
        }))],
        recordedBy: ownerId
      });
      
      await meterReading.save();
      
      // Update tenant's electricity tracking
      newTenant.electricityTracking.meterAssigned = true;
      newTenant.electricityTracking.meterNumber = `${property.propertyId}-${property.roomNumber}`;
      newTenant.electricityTracking.sharingElectricity = existingTenants.length > 0;
      await newTenant.save();
    }
    
    // Send welcome email/notification
    try {
      await sendEmail({
        to: personalInfo.email,
        subject: `Welcome to ${propertyDoc.name}`,
        html: `
          <h3>Welcome to ${propertyDoc.name}!</h3>
          <p>Dear ${personalInfo.name},</p>
          <p>Welcome to your new accommodation. Here are your details:</p>
          <ul>
            <li><strong>Tenant ID:</strong> ${newTenant.tenantId}</li>
            <li><strong>Room:</strong> ${property.roomNumber}</li>
            <li><strong>Check-in Date:</strong> ${new Date().toDateString()}</li>
            <li><strong>Monthly Rent:</strong> ₹${financials.monthlyRent}</li>
          </ul>
          <p>If you have any questions, please contact us.</p>
          <p>Best regards,<br>${propertyDoc.name} Management</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }
    
    res.json({
      success: true,
      message: 'Tenant added successfully',
      data: {
        tenantId: newTenant.tenantId,
        tenant: newTenant,
        checkInDate: newTenant.stayDetails.checkInDate
      }
    });
    
  } catch (error) {
    console.error('Add tenant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add tenant',
      error: error.message
    });
  }
};

// 3. Get Single Tenant Details (Complete Profile)
export const getTenantDetails = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const ownerId = req.user._id;
    
    const tenant = await TenantTracking.findOne({
      _id: tenantId,
      owner: ownerId
    }).populate('property.propertyId', 'name address city');
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }
    
    // Get recent electricity bills
    const electricityBills = await ElectricityBill.find({
      'tenantBills.tenantId': tenantId
    }).sort({ billMonth: -1 }).limit(6);
    
    // Get roommates details
    const roommates = await TenantTracking.find({
      'property.propertyId': tenant.property.propertyId,
      'property.roomNumber': tenant.property.roomNumber,
      'stayDetails.isActive': true,
      _id: { $ne: tenantId }
    }).select('personalInfo.name stayDetails.checkInDate tenantId');
    
    res.json({
      success: true,
      data: {
        tenant,
        electricityBills,
        roommates,
        analytics: {
          currentStayDuration: tenant.currentStayDuration,
          totalOutstanding: tenant.totalOutstanding,
          paymentHistory: tenant.financials.payments.length,
          maintenanceRequests: tenant.maintenanceRequests.length
        }
      }
    });
    
  } catch (error) {
    console.error('Get tenant details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant details',
      error: error.message
    });
  }
};

// 4. Check-out Tenant (Complete Check-out Process)
export const checkOutTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { checkOutReason, notes, finalDues, depositRefund } = req.body;
    const ownerId = req.user._id;
    
    const tenant = await TenantTracking.findOne({
      _id: tenantId,
      owner: ownerId,
      'stayDetails.isActive': true
    });
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Active tenant not found'
      });
    }
    
    // Perform check-out
    await tenant.checkOut(checkOutReason, notes, ownerId);
    
    // Update dues if provided
    if (finalDues) {
      tenant.financials.currentDues = {
        ...tenant.financials.currentDues,
        ...finalDues,
        total: (finalDues.rent || 0) + (finalDues.electricity || 0) + (finalDues.other || 0)
      };
    }
    
    // Handle deposit refund
    if (depositRefund) {
      tenant.financials.depositStatus.refunded = depositRefund.amount || 0;
      tenant.financials.depositStatus.refundDate = new Date();
    }
    
    await tenant.save();
    
    // Update roommates' sharing details
    await TenantTracking.updateMany(
      {
        'property.propertyId': tenant.property.propertyId,
        'property.roomNumber': tenant.property.roomNumber,
        'stayDetails.isActive': true,
        _id: { $ne: tenantId }
      },
      {
        $pull: {
          'sharingDetails.roommates': { tenantId: tenantId }
        },
        $inc: { 'sharingDetails.currentOccupancy': -1 }
      }
    );
    
    // Add meter reading for electricity tracking
    const remainingTenants = await TenantTracking.find({
      'property.propertyId': tenant.property.propertyId,
      'property.roomNumber': tenant.property.roomNumber,
      'stayDetails.isActive': true
    });
    
    if (tenant.electricityTracking.meterAssigned) {
      const lastReading = await MeterReading.findOne({
        roomId: tenant.property.propertyId,
        roomNumber: tenant.property.roomNumber
      }).sort({ createdAt: -1 });
      
      const meterReading = new MeterReading({
        roomId: tenant.property.propertyId,
        roomNumber: tenant.property.roomNumber,
        reading: lastReading?.reading || 0,
        action: 'tenant_left',
        activeTenants: remainingTenants.length,
        tenantDetails: remainingTenants.map(t => ({
          tenantId: t._id,
          name: t.personalInfo.name,
          joinDate: t.stayDetails.checkInDate,
          isActive: true
        })),
        recordedBy: ownerId,
        notes: `Tenant ${tenant.personalInfo.name} checked out`
      });
      
      await meterReading.save();
    }
    
    // Send check-out confirmation email
    try {
      await sendEmail({
        to: tenant.personalInfo.email,
        subject: 'Check-out Confirmation',
        html: `
          <h3>Check-out Confirmation</h3>
          <p>Dear ${tenant.personalInfo.name},</p>
          <p>Your check-out has been processed successfully.</p>
          <ul>
            <li><strong>Check-out Date:</strong> ${tenant.stayDetails.actualCheckOutDate.toDateString()}</li>
            <li><strong>Total Stay:</strong> ${tenant.stayDetails.totalStayDays} days</li>
            <li><strong>Final Dues:</strong> ₹${tenant.financials.currentDues.total}</li>
            ${depositRefund ? `<li><strong>Deposit Refund:</strong> ₹${depositRefund.amount}</li>` : ''}
          </ul>
          <p>Thank you for staying with us!</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send check-out email:', emailError);
    }
    
    res.json({
      success: true,
      message: 'Tenant checked out successfully',
      data: {
        tenantId: tenant.tenantId,
        checkOutDate: tenant.stayDetails.actualCheckOutDate,
        totalStayDays: tenant.stayDetails.totalStayDays,
        finalDues: tenant.financials.currentDues.total
      }
    });
    
  } catch (error) {
    console.error('Check-out tenant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check-out tenant',
      error: error.message
    });
  }
};

// 5. Add Payment for Tenant
export const addTenantPayment = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { amount, type, method, transactionId, notes } = req.body;
    const ownerId = req.user._id;
    
    const tenant = await TenantTracking.findOne({
      _id: tenantId,
      owner: ownerId
    });
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }
    
    // Add payment
    await tenant.addPayment(amount, type, method, transactionId, notes, ownerId);
    await tenant.updateAnalytics();
    
    // Send payment confirmation
    try {
      await sendEmail({
        to: tenant.personalInfo.email,
        subject: 'Payment Confirmation',
        html: `
          <h3>Payment Received</h3>
          <p>Dear ${tenant.personalInfo.name},</p>
          <p>We have received your payment:</p>
          <ul>
            <li><strong>Amount:</strong> ₹${amount}</li>
            <li><strong>Type:</strong> ${type}</li>
            <li><strong>Method:</strong> ${method}</li>
            <li><strong>Date:</strong> ${new Date().toDateString()}</li>
            ${transactionId ? `<li><strong>Transaction ID:</strong> ${transactionId}</li>` : ''}
          </ul>
          <p>Thank you for your payment!</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send payment confirmation email:', emailError);
    }
    
    res.json({
      success: true,
      message: 'Payment added successfully',
      data: {
        paymentDate: new Date(),
        amount,
        type,
        remainingDues: tenant.financials.currentDues.total
      }
    });
    
  } catch (error) {
    console.error('Add payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add payment',
      error: error.message
    });
  }
};

// 6. Get Room-wise Occupancy for Owner
export const getRoomOccupancy = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const { propertyId } = req.query;
    
    let query = { owner: ownerId, 'stayDetails.isActive': true };
    if (propertyId) query['property.propertyId'] = propertyId;
    
    const occupancyData = await TenantTracking.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            propertyId: '$property.propertyId',
            propertyName: '$property.propertyName',
            roomNumber: '$property.roomNumber'
          },
          tenants: {
            $push: {
              tenantId: '$tenantId',
              name: '$personalInfo.name',
              checkInDate: '$stayDetails.checkInDate',
              monthlyRent: '$financials.monthlyRent',
              currentDues: '$financials.currentDues.total'
            }
          },
          totalTenants: { $sum: 1 },
          totalRent: { $sum: '$financials.monthlyRent' },
          totalDues: { $sum: '$financials.currentDues.total' }
        }
      },
      {
        $group: {
          _id: {
            propertyId: '$_id.propertyId',
            propertyName: '$_id.propertyName'
          },
          rooms: {
            $push: {
              roomNumber: '$_id.roomNumber',
              tenants: '$tenants',
              totalTenants: '$totalTenants',
              totalRent: '$totalRent',
              totalDues: '$totalDues'
            }
          },
          totalPropertyTenants: { $sum: '$totalTenants' },
          totalPropertyRent: { $sum: '$totalRent' },
          totalPropertyDues: { $sum: '$totalDues' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: occupancyData
    });
    
  } catch (error) {
    console.error('Get room occupancy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room occupancy',
      error: error.message
    });
  }
};

// 7. Get Overdue Tenants
export const getOverdueTenants = async (req, res) => {
  try {
    const ownerId = req.user._id;
    
    const overdueTenants = await TenantTracking.find({
      owner: ownerId,
      'stayDetails.isActive': true,
      'financials.currentDues.total': { $gt: 0 }
    }).populate('property.propertyId', 'name address');
    
    // Categorize by overdue duration
    const today = new Date();
    const categorized = {
      upTo7Days: [],
      upTo15Days: [],
      upTo30Days: [],
      moreThan30Days: []
    };
    
    overdueTenants.forEach(tenant => {
      const daysSinceLastPayment = tenant.analytics.lastPaymentDate 
        ? Math.floor((today - tenant.analytics.lastPaymentDate) / (24 * 60 * 60 * 1000))
        : Math.floor((today - tenant.stayDetails.checkInDate) / (24 * 60 * 60 * 1000));
      
      if (daysSinceLastPayment <= 7) {
        categorized.upTo7Days.push({ ...tenant.toObject(), daysSinceLastPayment });
      } else if (daysSinceLastPayment <= 15) {
        categorized.upTo15Days.push({ ...tenant.toObject(), daysSinceLastPayment });
      } else if (daysSinceLastPayment <= 30) {
        categorized.upTo30Days.push({ ...tenant.toObject(), daysSinceLastPayment });
      } else {
        categorized.moreThan30Days.push({ ...tenant.toObject(), daysSinceLastPayment });
      }
    });
    
    const summary = {
      totalOverdue: overdueTenants.length,
      totalOverdueAmount: overdueTenants.reduce((sum, tenant) => sum + tenant.financials.currentDues.total, 0),
      categories: {
        upTo7Days: categorized.upTo7Days.length,
        upTo15Days: categorized.upTo15Days.length,
        upTo30Days: categorized.upTo30Days.length,
        moreThan30Days: categorized.moreThan30Days.length
      }
    };
    
    res.json({
      success: true,
      data: {
        categorized,
        summary
      }
    });
    
  } catch (error) {
    console.error('Get overdue tenants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overdue tenants',
      error: error.message
    });
  }
};

// 8. Update Tenant Information
export const updateTenantInfo = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const ownerId = req.user._id;
    const updateData = req.body;
    
    const tenant = await TenantTracking.findOne({
      _id: tenantId,
      owner: ownerId
    });
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }
    
    // Update allowed fields
    const allowedUpdates = ['personalInfo', 'financials', 'documents', 'tenantProfile'];
    allowedUpdates.forEach(field => {
      if (updateData[field]) {
        tenant[field] = { ...tenant[field], ...updateData[field] };
      }
    });
    
    await tenant.save();
    
    res.json({
      success: true,
      message: 'Tenant information updated successfully',
      data: tenant
    });
    
  } catch (error) {
    console.error('Update tenant info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tenant information',
      error: error.message
    });
  }
};
