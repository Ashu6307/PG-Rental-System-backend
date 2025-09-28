import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import OwnerProfile from '../models/OwnerProfile.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import Otp from '../models/Otp.js';
import { authenticateJWT } from '../middleware/auth.js';
// Enhanced Email System Import
import EmailManager from '../modules/email/EmailManager.js';
import { sendNotification } from '../utils/notificationService.js';
import { logAction } from '../utils/auditLogService.js';
import { Parser } from 'json2csv';

const router = express.Router();

// Admin OTP Send (with password verification)
router.post('/send-otp', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    
    // Check if admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify password before sending OTP
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Rate limiting for admin (10 OTPs per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const otpCount = await Otp.countDocuments({ 
      email, 
      role: 'admin',
      createdAt: { $gte: oneHourAgo } 
    });
    
    if (otpCount >= 10) {
      return res.status(429).json({ 
        success: false, 
        message: 'Too many OTP requests. Maximum 10 OTPs per hour allowed for admins.' 
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes (already correct)

    // Delete any existing OTPs for this email
    await Otp.deleteMany({ email, role: 'admin' });

    // Save new OTP
    await Otp.create({
      email,
      otp,
      expiresAt,
      role: 'admin'
    });

    // Send OTP email using Enhanced Email Manager
    try {
      await EmailManager.sendOTPEmail(
        { email, name: 'Admin' }, 
        otp, 
        'admin login',
        { useQueue: false } // High priority - immediate sending
      );
      
      res.json({ success: true, message: 'OTP sent to your email' });
    } catch (emailError) {
      console.error('Admin OTP send error:', emailError);
      res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
  } catch (error) {
    console.error('Admin OTP send error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

// Admin OTP Verify & Login
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Input validation
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: 'Invalid OTP format. Must be 6 digits.' });
    }

    // Check if OTP exists first (regardless of expiry)
    const existingOtp = await Otp.findOne({ 
      email, 
      otp, 
      role: 'admin'
    });

    if (!existingOtp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Check if OTP is expired
    if (existingOtp.expiresAt <= new Date()) {
      // Clean up expired OTP
      await Otp.deleteOne({ _id: existingOtp._id });
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    // Check if OTP was already used (if you have a 'used' field)
    if (existingOtp.used) {
      return res.status(400).json({ success: false, message: 'OTP already used' });
    }

    // Get admin details
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ success: false, message: 'Admin not found' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Mark OTP as used and delete it
    await Otp.deleteOne({ _id: existingOtp._id });

    // Generate JWT token (Extended expiry for admin)
    const token = jwt.sign(
      { id: admin._id, role: 'admin' }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' } // 7 days for admin vs 1 day for users
    );

    res.json({ 
      success: true, 
      token, 
      user: { 
        id: admin._id, 
        name: admin.name, 
        email: admin.email,
        role: 'admin'
      } 
    });
  } catch (error) {
    console.error('Admin OTP verify error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
});


// Admin Direct Login (No OTP required initially)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find admin
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Update last login
    admin.lastLogin = new Date();
    await admin.save();
    
    // Generate JWT token (Extended expiry for admin)
    const token = jwt.sign(
      { id: admin._id, role: 'admin' }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' } // 7 days for admin vs 1 day for users
    );
    
    res.json({ 
      success: true,
      token, 
      user: { 
        id: admin._id, 
        name: admin.name, 
        email: admin.email,
        role: 'admin'
      } 
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin Profile/Me endpoint
router.get('/me', authenticateJWT, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    // Get admin details
    const admin = await Admin.findById(req.user.id).select('-password');
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    res.json({ 
      success: true,
      user: { 
        id: admin._id, 
        name: admin.name, 
        email: admin.email,
        role: 'admin',
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt
      } 
    });
  } catch (error) {
    console.error('Admin me endpoint error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin Dashboard endpoint
router.get('/dashboard', authenticateJWT, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    // Get dashboard stats
    const totalUsers = await User.countDocuments();
    const totalOwners = await OwnerProfile.countDocuments();
    const totalBookings = 0; // Placeholder - add booking model count if available
    const totalRevenue = 0; // Placeholder - add revenue calculation if available

    res.json({ 
      success: true,
      stats: {
        totalUsers,
        totalOwners,
        totalBookings,
        totalRevenue,
        pendingApprovals: 0,
        activeProperties: 0,
        systemAlerts: 0,
        monthlyGrowth: 0
      },
      recentActivities: [],
      pendingApprovals: [],
      systemAlerts: []
    });
  } catch (error) {
    console.error('Admin dashboard endpoint error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Approve KYC
router.post('/approve-kyc/:ownerId', authenticateJWT, async (req, res) => {
  try {
    // Only admin can approve
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const ownerProfile = await OwnerProfile.findOne({ owner_id: req.params.ownerId });
    if (!ownerProfile) return res.status(404).json({ error: 'Owner profile not found' });
    ownerProfile.approval_status = 'approved';
    await ownerProfile.save();
    // Send notification
    await sendNotification({
      userId: req.params.ownerId,
      type: 'email',
      message: 'Your KYC has been approved.',
      channel: 'system',
      meta: { kycStatus: 'approved' }
    });
    // Audit log
    await logAction({
      action: 'KYC Approved',
      performedBy: req.user.id,
      targetId: ownerProfile._id,
      targetType: 'OwnerProfile',
      details: { status: 'approved' }
    });
    res.json({ message: 'KYC approved' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Reject KYC (reason required)
router.post('/reject-kyc/:ownerId', authenticateJWT, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Rejection reason required' });
    const ownerProfile = await OwnerProfile.findOne({ owner_id: req.params.ownerId });
    if (!ownerProfile) return res.status(404).json({ error: 'Owner profile not found' });
    ownerProfile.approval_status = 'rejected';
    ownerProfile.rejection_reason = reason;
    await ownerProfile.save();
    // Send notification
    await sendNotification({
      userId: req.params.ownerId,
      type: 'email',
      message: `Your KYC was rejected. Reason: ${reason}`,
      channel: 'system',
      meta: { kycStatus: 'rejected', reason }
    });
    // Audit log
    await logAction({
      action: 'KYC Rejected',
      performedBy: req.user.id,
      targetId: ownerProfile._id,
      targetType: 'OwnerProfile',
      details: { status: 'rejected', reason }
    });
    res.json({ message: 'KYC rejected', reason });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Fetch audit logs
router.get('/audit-logs', authenticateJWT, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const logs = await (await import('../models/AuditLog.js')).default.find().sort({ created_at: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch notifications
router.get('/notifications', authenticateJWT, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const notifications = await (await import('../models/Notification.js')).default.find().sort({ created_at: -1 }).limit(100);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin analytics
router.get('/analytics', authenticateJWT, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const { type, dateFrom, dateTo } = req.query;
    const filter = {};
    if (dateFrom || dateTo) {
      filter.created_at = {};
      if (dateFrom) filter.created_at.$gte = new Date(dateFrom);
      if (dateTo) filter.created_at.$lte = new Date(dateTo);
    }
    let stats = {};
    if (!type || type === 'all' || type === 'booking') {
      const Booking = (await import('../models/Booking.js')).default;
      stats.bookings = await Booking.countDocuments(filter);
    }
    if (!type || type === 'all' || type === 'payment') {
      const Payment = (await import('../models/Payment.js')).default;
      stats.payments = await Payment.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).then(r => r[0]?.total || 0);
    }
    if (!type || type === 'all' || type === 'review') {
      const Review = (await import('../models/Review.js')).default;
      stats.reviews = await Review.countDocuments(filter);
    }
    if (!type || type === 'all' || type === 'user') {
      const User = (await import('../models/User.js')).default;
      stats.users = await User.countDocuments(filter);
    }
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export analytics
router.get('/export-analytics', authenticateJWT, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const { type, dateFrom, dateTo } = req.query;
    const filter = {};
    if (dateFrom || dateTo) {
      filter.created_at = {};
      if (dateFrom) filter.created_at.$gte = new Date(dateFrom);
      if (dateTo) filter.created_at.$lte = new Date(dateTo);
    }
    let data = [];
    let fields = [];
    if (type === 'booking') {
      const Booking = (await import('../models/Booking.js')).default;
      data = await Booking.find(filter).lean();
      fields = ['_id', 'user_id', 'item_type', 'item_id', 'from_date', 'to_date', 'amount', 'status', 'created_at'];
    } else if (type === 'payment') {
      const Payment = (await import('../models/Payment.js')).default;
      data = await Payment.find(filter).lean();
      fields = ['_id', 'user_id', 'booking_id', 'amount', 'status', 'created_at'];
    } else if (type === 'review') {
      const Review = (await import('../models/Review.js')).default;
      data = await Review.find(filter).lean();
      fields = ['_id', 'user_id', 'item_type', 'item_id', 'rating', 'comment', 'created_at'];
    } else if (type === 'user') {
      const User = (await import('../models/User.js')).default;
      data = await User.find(filter).lean();
      fields = ['_id', 'name', 'email', 'phone', 'role', 'created_at'];
    } else {
      return res.status(400).json({ error: 'Invalid type for export' });
    }
    const parser = new Parser({ fields });
    const csv = parser.parse(data);
    res.header('Content-Type', 'text/csv');
    res.attachment(`${type}-export.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get recent activities for admin dashboard
router.get('/recent-activities', authenticateJWT, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    
    // Mock recent activities data
    const activities = [
      {
        id: 1,
        type: 'user_registration',
        description: 'New user registered',
        user: 'John Doe',
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        details: 'User john.doe@email.com registered successfully'
      },
      {
        id: 2,
        type: 'owner_verification',
        description: 'Owner KYC submitted',
        user: 'Jane Smith',
        timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
        details: 'KYC documents submitted for verification'
      },
      {
        id: 3,
        type: 'booking',
        description: 'New booking created',
        user: 'Mike Johnson',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        details: 'Booking #PG001 created for PG #PG123'
      }
    ];
    
    res.json({ success: true, activities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get pending approvals for admin dashboard
router.get('/pending-approvals', authenticateJWT, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    
    // Get pending owner verifications
    const pendingOwners = await OwnerProfile.find({ 
      kycStatus: 'pending' 
    }).populate('user', 'name email').limit(10);
    
    const approvals = pendingOwners.map(owner => ({
      id: owner._id,
      type: 'kyc_verification',
      title: 'KYC Verification',
      description: `${owner.user?.name || 'Unknown'} submitted KYC documents`,
      submittedAt: owner.kycSubmittedAt,
      priority: 'high',
      data: {
        ownerId: owner._id,
        ownerName: owner.user?.name,
        ownerEmail: owner.user?.email,
        documentsCount: owner.documents?.length || 0
      }
    }));
    
    res.json({ success: true, approvals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get system alerts for admin dashboard
router.get('/system-alerts', authenticateJWT, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    
    // Mock system alerts data
    const alerts = [
      {
        id: 1,
        type: 'warning',
        title: 'Server Performance',
        message: 'High CPU usage detected on server',
        timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
        severity: 'medium',
        resolved: false
      },
      {
        id: 2,
        type: 'info',
        title: 'Database Backup',
        message: 'Daily database backup completed successfully',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        severity: 'low',
        resolved: true
      }
    ];
    
    res.json({ success: true, alerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export audit logs (CSV/PDF)
router.get('/audit/export', async (req, res) => {
  const { format, filters } = req.query;
  try {
    // TODO: Implement audit log export logic
    // Example: Generate CSV/PDF and return download link
    res.status(501).json({ 
      success: false, 
      message: 'Export functionality not implemented yet',
      requested: { format, filters }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Export analytics (CSV/PDF)
router.get('/analytics/export', async (req, res) => {
  const { format, filters } = req.query;
  try {
    // TODO: Implement analytics export logic
    // Example: Generate CSV/PDF and return download link
    res.status(501).json({ 
      success: false, 
      message: 'Analytics export functionality not implemented yet',
      requested: { format, filters }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Export GDPR/data consent logs
router.get('/gdpr/export', async (req, res) => {
  const { format, filters } = req.query;
  try {
    // TODO: Implement GDPR/data consent export logic
    // Example: Generate CSV/PDF and return download link
    res.status(501).json({ 
      success: false, 
      message: 'GDPR export functionality not implemented yet',
      requested: { format, filters }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Webhook logs export endpoint
router.get('/webhook-logs/export', async (req, res) => {
  try {
    // TODO: Integrate with webhook log storage/service
    res.status(501).json({ 
      success: false, 
      message: 'Webhook logs export functionality not implemented yet'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Versioned settings API
router.post('/settings/version', async (req, res) => {
  const { version, settings } = req.body;
  try {
    // TODO: Implement versioned settings logic
    // Example: Update settingsVersion in Admin model
    await Admin.updateOne({}, { settingsVersion: version, settings });
    res.status(200).json({ success: true, message: 'Settings updated with version.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Webhook event trigger endpoint
router.post('/webhook/trigger', async (req, res) => {
  try {
    // TODO: Integrate with webhook service
    // Example: await triggerWebhookEvent(eventType, payload);
    res.status(200).json({ success: true, message: 'Webhook event triggered.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create New Admin (Super Admin Only)
router.post('/create-admin', authenticateJWT, async (req, res) => {
  try {
    // Check if user is super admin
    const currentAdmin = await Admin.findById(req.user.id);
    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only Super Admin can create new administrators' 
      });
    }

    const { 
      name, 
      email, 
      phone, 
      password, 
      role, 
      assignedCities, 
      permissions 
    } = req.body;

    // Input validation
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'All required fields must be provided' 
      });
    }

    // Validate role
    const validRoles = ['admin', 'super_admin', 'city_admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid admin role' 
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ 
        success: false, 
        message: 'Admin with this email already exists' 
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Set permissions based on role
    let adminPermissions = {
      ownerVerification: true,
      propertyApproval: true,
      userManagement: true,
      cityManagement: role === 'super_admin',
      adminManagement: role === 'super_admin'
    };

    // Override with provided permissions if any
    if (permissions) {
      adminPermissions = {
        ...adminPermissions,
        ...permissions,
        // Ensure only super_admin can have these permissions
        cityManagement: role === 'super_admin' ? permissions.cityManagement !== false : false,
        adminManagement: role === 'super_admin' ? permissions.adminManagement !== false : false
      };
    }

    // Create new admin
    const newAdmin = new Admin({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: hashedPassword,
      role,
      isActive: true,
      assignedCities: role === 'city_admin' ? (assignedCities || []) : [],
      permissions: adminPermissions,
      created_at: new Date(),
      stats: {
        ownersVerified: 0,
        propertiesApproved: 0,
        inquiriesHandled: 0,
        lastActiveDate: new Date()
      }
    });

    await newAdmin.save();

    // Send welcome email using Enhanced Email Manager
    try {
      await EmailManager.sendWelcomeEmail(
        { email: newAdmin.email, name: newAdmin.name },
        {
          role: role,
          loginUrl: process.env.FRONTEND_URL + '/sys-mgmt/auth',
          tempPassword: password // In production, generate temp password
        }
      );
    } catch (emailError) {
      console.warn('Failed to send welcome email to new admin:', emailError);
      // Don't fail the admin creation if email fails
    }

    // Log the admin creation action
    await logAction({
      action: 'Admin Created',
      performedBy: req.user.id,
      targetId: newAdmin._id,
      targetType: 'Admin',
      details: { 
        newAdminEmail: newAdmin.email, 
        newAdminRole: role,
        assignedCities: newAdmin.assignedCities?.length || 0
      }
    });

    res.json({ 
      success: true, 
      message: 'Admin created successfully',
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        isActive: newAdmin.isActive,
        assignedCities: newAdmin.assignedCities,
        permissions: newAdmin.permissions,
        createdAt: newAdmin.created_at
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create admin. Please try again.' 
    });
  }
});

// List All Admins (Super Admin Only)
router.get('/list-admins', authenticateJWT, async (req, res) => {
  try {
    // Check if user is super admin
    const currentAdmin = await Admin.findById(req.user.id);
    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only Super Admin can view administrator list' 
      });
    }

    // Get all admins except passwords
    const adminList = await Admin.find({}).select('-password').sort({ created_at: -1 });

    const formattedAdmins = adminList.map(admin => ({
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      assignedCities: admin.assignedCities || [],
      permissions: admin.permissions,
      lastLogin: admin.lastLogin,
      createdAt: admin.created_at,
      stats: admin.stats
    }));

    res.json({ 
      success: true, 
      admins: formattedAdmins,
      total: formattedAdmins.length
    });

  } catch (error) {
    console.error('List admins error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch administrators' 
    });
  }
});

// Toggle Admin Status (Super Admin Only)
router.patch('/toggle-status/:adminId', authenticateJWT, async (req, res) => {
  try {
    // Check if user is super admin
    const currentAdmin = await Admin.findById(req.user.id);
    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only Super Admin can modify administrator status' 
      });
    }

    const { adminId } = req.params;
    const { isActive } = req.body;

    // Prevent super admin from deactivating themselves
    if (adminId === req.user.id && !isActive) {
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot deactivate your own account' 
      });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Administrator not found' 
      });
    }

    admin.isActive = isActive;
    await admin.save();

    // Log the action
    await logAction({
      action: `Admin ${isActive ? 'Activated' : 'Deactivated'}`,
      performedBy: req.user.id,
      targetId: admin._id,
      targetType: 'Admin',
      details: { 
        targetEmail: admin.email, 
        newStatus: isActive 
      }
    });

    res.json({ 
      success: true, 
      message: `Admin ${isActive ? 'activated' : 'deactivated'} successfully`,
      admin: {
        id: admin._id,
        isActive: admin.isActive
      }
    });

  } catch (error) {
    console.error('Toggle admin status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update administrator status' 
    });
  }
});

export default router;
