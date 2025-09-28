import Otp from '../models/Otp.js';
import User from '../models/User.js';
import OwnerProfile from '../models/OwnerProfile.js';
// Enhanced Email System Import
import EmailManager from '../modules/email/EmailManager.js';
import OtpAudit from '../models/OtpAudit.js';
import axios from 'axios';
import Settings from '../models/Settings.js';

// Helper: Audit log
async function logOtpAction(email, action, status, message, req) {
  await OtpAudit.create({
    email,
    action,
    status,
    message,
    ip: req.ip || req.headers['x-forwarded-for'] || '',
  });
}

// Helper: Rate limit (role-based limits per hour)
async function isRateLimited(email, role = 'user') {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const count = await OtpAudit.countDocuments({ email, action: 'send', createdAt: { $gte: oneHourAgo } });
  
  // Role-based rate limits (synced with frontend config)
  let maxLimit;
  switch (role) {
    case 'admin':
      maxLimit = 10; // Admin: 10 OTP per hour
      break;
    case 'owner':
      maxLimit = 8;  // Owner: 8 OTP per hour (updated to match frontend)
      break;
    case 'user':
    default:
      maxLimit = 6;  // User: 6 OTP per hour (updated to match frontend)
      break;
  }
  
  return count >= maxLimit;
}

// Helper: Get versioned settings (OTP length, expiry, retry)
async function getOtpSettings() {
  // Settings model se fetch karo, fallback default
  const settings = await Settings.findOne({ key: 'otp' });
  return {
    length: settings?.length || 6,
    expiry: settings?.expiry || 5 * 60, // seconds
    retryLimit: settings?.retryLimit || 3,
    webhookUrl: settings?.webhookUrl || '',
  };
}


// Helper: Multi-tenancy (tenantId support)
function getTenantId(req) {
  return req.headers['x-tenant-id'] || null;
}

// Helper: Analytics log
async function logAnalytics(email, action, status) {
  // Analytics model me save karo
  // ...implementation...
}

// Update OTP generation to use versioned settings
function generateOtp(length = 6) {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
}

async function sendOtp(req, res) {
  const { email, role } = req.body;
  const userRole = role || 'user'; // Default to 'user' if role not provided
  const tenantId = getTenantId(req);
  const otpSettings = await getOtpSettings();
  
  if (!email) {
    await logOtpAction(email, 'send', 'error', 'Email required', req);
    return res.status(400).json({ success: false, message: 'Email required' });
  }

  // Note: Email existence check is now done separately via /check-email endpoint
  // This allows for better UX where users get immediate feedback before OTP is sent
  
  if (await isRateLimited(email, userRole)) {
    const limits = { user: 6, owner: 8, admin: 10 }; // Updated to match frontend config
    const maxLimit = limits[userRole] || 6;
    await logOtpAction(email, 'send', 'error', 'Rate limit exceeded', req);
    return res.status(429).json({ 
      success: false, 
      message: `Too many OTP requests. Maximum ${maxLimit} OTPs per hour allowed for ${userRole}s.` 
    });
  }
  
  const otp = generateOtp(otpSettings.length);
  const expiresAt = new Date(Date.now() + otpSettings.expiry * 1000);
  await Otp.deleteMany({ email });
  await Otp.create({ email, otp, expiresAt, tenantId, role: userRole });
  
  // Send OTP email using Enhanced Email Manager
  try {
    await EmailManager.sendOTPEmail(
      { email, name: 'User' }, 
      otp, 
      'email verification',
      { useQueue: false } // High priority - immediate sending
    );
    
    await logOtpAction(email, 'send', 'success', 'OTP sent successfully', req);
    return res.json({ success: true, message: 'OTP sent successfully' });
    
  } catch (emailError) {
    // Email failed but OTP is still generated and stored
    await logOtpAction(email, 'send', 'email_failed', `Email failed: ${emailError.message}`, req);
    
    return res.json({ 
      success: true, 
      message: 'OTP generated. Email service temporarily unavailable, but OTP is valid for verification.',
      warning: 'Email delivery may be delayed'
    });
  }
};

async function verifyOtp(req, res) {
  const { email, otp } = req.body;
  const tenantId = getTenantId(req);
  const record = await Otp.findOne({ email, otp, tenantId });
  if (!record) {
    await logOtpAction(email, 'verify', 'error', 'Invalid OTP', req);
    await logAnalytics(email, 'verify', 'error');
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }
  if (record.expiresAt < new Date()) {
    await logOtpAction(email, 'verify', 'error', 'OTP expired', req);
    await logAnalytics(email, 'verify', 'error');
    return res.status(400).json({ success: false, message: 'OTP expired' });
  }
  record.verified = true;
  // Don't mark as used here - will be marked when used for registration
  await record.save();
  await logOtpAction(email, 'verify', 'success', 'OTP verified', req);
  await logAnalytics(email, 'verify', 'success');
  // Webhook trigger
  const otpSettings = await getOtpSettings();
  if (otpSettings.webhookUrl) {
    axios.post(otpSettings.webhookUrl, { email, tenantId, event: 'otp_verified', time: new Date() }).catch(() => {});
  }
  res.json({ success: true, message: 'OTP verified' });
};

async function resendOtp(req, res) {
  const { email, role } = req.body;
  const userRole = role || 'user'; // Default to 'user' if role not provided
  const tenantId = getTenantId(req);
  const otpSettings = await getOtpSettings();
  
  if (!email) {
    await logOtpAction(email, 'resend', 'error', 'Email required', req);
    return res.status(400).json({ success: false, message: 'Email required' });
  }
  
  if (await isRateLimited(email, userRole)) {
    const limits = { user: 6, owner: 8, admin: 10 }; // Updated to match frontend config
    const maxLimit = limits[userRole] || 6;
    await logOtpAction(email, 'resend', 'error', 'Rate limit exceeded', req);
    return res.status(429).json({ 
      success: false, 
      message: `Too many OTP requests. Maximum ${maxLimit} OTPs per hour allowed for ${userRole}s.` 
    });
  }
  
  const otp = generateOtp(otpSettings.length);
  const expiresAt = new Date(Date.now() + otpSettings.expiry * 1000);
  await Otp.deleteMany({ email });
  await Otp.create({ email, otp, expiresAt, tenantId, role: userRole });
  
  // Send OTP email using Enhanced Email Manager
  try {
    await EmailManager.sendOTPEmail(
      { email, name: 'User' }, 
      otp, 
      'OTP resend request',
      { useQueue: false } // High priority - immediate sending
    );
    
    await logOtpAction(email, 'resend', 'success', 'OTP resent', req);
    await logAnalytics(email, 'resend', 'success');
    res.json({ success: true, message: 'OTP resent' });
    
  } catch (emailError) {
    await logOtpAction(email, 'resend', 'email_failed', `Email failed: ${emailError.message}`, req);
    res.json({ 
      success: true, 
      message: 'OTP generated. Email service temporarily unavailable, but OTP is valid for verification.' 
    });
  }
};

// Check if email already exists for registration
async function checkEmailExists(req, res) {
  const { email, role } = req.body;
  const userRole = role || 'user';

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email required' });
  }

  try {
    let existingUser = null;
    
    // Check based on role
    if (userRole === 'owner') {
      // For owners, check both User table (with role='owner') and OwnerProfile table
      existingUser = await User.findOne({ email, role: 'owner' }) || 
                     await OwnerProfile.findOne({ email });
    } else {
      // For users and admins, check User table
      existingUser = await User.findOne({ email, role: userRole });
    }
    
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: `This email is already registered as ${userRole}. Please try logging in instead.`,
        alreadyRegistered: true,
        exists: true
      });
    }

    // Email is available for registration
    return res.json({ 
      success: true, 
      message: 'Email is available for registration',
      exists: false
    });

  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error checking email availability' 
    });
  }
}

// Cleanup expired OTPs (background job)
async function cleanupExpiredOtps() {
  await Otp.deleteMany({ expiresAt: { $lt: new Date() } });
}

export default {
  sendOtp,
  verifyOtp,
  resendOtp,
  checkEmailExists,
  cleanupExpiredOtps
};
