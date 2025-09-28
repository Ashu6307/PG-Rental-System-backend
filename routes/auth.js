import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { hashPassword, comparePassword, authenticateJWT } from '../middleware/auth.js';
import uploadKYC from '../middleware/uploadKYC.js';
import OwnerProfile from '../models/OwnerProfile.js';
import { blacklistToken, logSuspiciousActivity } from '../middleware/security.js';
// Enhanced Email System Import
import EmailManager from '../modules/email/EmailManager.js';
import rateLimit from 'express-rate-limit';
import { isValidIndianMobile } from '../utils/mobileValidation.js';
import { validateName, formatName } from '../utils/nameValidation.js';

const router = express.Router();

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many login attempts. Please try again after 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Register with Email Verification

router.post('/register', async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    gender,
    dob,
    address,
    profilePhoto,
    role,
    ownerName,
    businessType,
    referralCode,
    otp // Add OTP field for verification
  } = req.body;
  try {
    // Check if OTP is provided and valid
    if (!otp) {
      return res.status(400).json({ error: 'Email verification OTP is required.' });
    }

    // Verify OTP first - check for verified and unused OTP
    const otpRecord = await import('../models/Otp.js').then(m => m.default);
    const validOtp = await otpRecord.findOne({ 
      email, 
      otp, 
      verified: true,  // Changed to true since we need verified OTP for registration
      used: false,     // Must not be used before
      expiresAt: { $gt: new Date() }
    });

    if (!validOtp) {
      return res.status(400).json({ error: 'Invalid or expired OTP. Please verify your email first.' });
    }

    // Mark OTP as used to prevent reuse
    await otpRecord.updateOne(
      { _id: validOtp._id },
      { used: true, usedAt: new Date() }
    );

    // Password strength validation
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    if (!strongRegex.test(password)) {
      return res.status(400).json({ error: 'Password must contain uppercase, lowercase, number, and special character.' });
    }

    // Name validation for regular users
    if (role !== 'admin' && name) {
      const nameValidation = validateName(name);
      if (!nameValidation.isValid) {
        return res.status(400).json({ error: nameValidation.error });
      }
    }

    // Owner name validation for owners
    if (role === 'owner' && ownerName) {
      const ownerNameValidation = validateName(ownerName);
      if (!ownerNameValidation.isValid) {
        return res.status(400).json({ error: `Owner ${ownerNameValidation.error.toLowerCase()}` });
      }
    }

    // Mobile number validation for non-admin users
    if (role !== 'admin' && phone && !isValidIndianMobile(phone)) {
      return res.status(400).json({ error: 'Please enter a valid Indian mobile number (10 digits, starting with 6-9).' });
    }

    // Store phone number as is (already 10 digits)
    const normalizedPhone = phone ? phone.replace(/\D/g, '') : null;
    
    // Format names before storing
    const formattedName = name ? formatName(name) : null;
    const formattedOwnerName = ownerName ? formatName(ownerName) : null;
    
    const password_hash = await hashPassword(password);
    let user;
    
    if (role === 'owner') {
      if (!businessType || !['PG', 'Room', 'Flat', 'All'].includes(businessType)) {
        return res.status(400).json({ error: 'Business type must be PG, Room, Flat, or All.' });
      }
      user = new User({
        name: formattedOwnerName,
        email,
        password_hash,
        phone: normalizedPhone,
        role,
        businessType,
        emailVerified: true, // Mark as verified since OTP was successful
        emailVerifiedAt: new Date()
      });
      await user.save();
      // OwnerProfile will be completed later when owner adds product
    } else {
      user = new User({
        name: formattedName,
        email,
        password_hash,
        phone: normalizedPhone,
        role: role || 'user',
        gender,
        dob,
        address,
        referralCode,
        profilePhoto,
        emailVerified: true, // Mark as verified since OTP was successful
        emailVerifiedAt: new Date()
      });
      await user.save();
    }

    // Mark OTP as verified and cleanup
    validOtp.verified = true;
    await validOtp.save();
    
    // Clean up all OTPs for this email
    await otpRecord.deleteMany({ email });

    // Send welcome email using Enhanced Email Manager
    try {
      await EmailManager.sendWelcomeEmail(user, { useQueue: false });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail registration if welcome email fails
    }

    res.status(201).json({ 
      success: true,
      message: 'Registration successful! Email verified.', 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address' });
    }

    // Check if user account is active
    if (user.status === 'blocked') {
      return res.status(403).json({ 
        error: 'Your account has been blocked. Please contact support.',
        supportEmail: 'support@propertyrentalpro.com'
      });
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ 
        error: 'Incorrect password. Please try again.',
        hint: 'Forgot your password? You can reset it.'
      });
    }

    // Update last login timestamp
    await User.updateOne(
      { _id: user._id },
      { 
        lastLogin: new Date(),
        $inc: { loginCount: 1 }
      }
    );

    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role,
        email: user.email 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    // Don't send password hash in response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      profilePhoto: user.profilePhoto,
      lastLogin: new Date()
    };

    res.json({ 
      success: true,
      message: 'Login successful',
      token, 
      user: userResponse 
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again later.' });
  }
});

// KYC upload route
router.post('/upload-kyc', authenticateJWT, uploadKYC.fields([
  { name: 'aadhaarFile', maxCount: 1 },
  { name: 'panFile', maxCount: 1 },
  { name: 'gstFile', maxCount: 1 },
  { name: 'passportFile', maxCount: 1 },
  { name: 'drivingFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const { aadhaarNumber, panNumber, gstNumber, passportNumber, drivingNumber } = req.body;
    if (!req.files['aadhaarFile'] || !aadhaarNumber || !req.files['panFile'] || !panNumber) {
      return res.status(400).json({ error: 'Aadhaar and PAN document/file number required!' });
    }
    const ownerProfile = await OwnerProfile.findOne({ owner_id: req.user.id });
    if (!ownerProfile) return res.status(404).json({ error: 'Owner profile not found' });
    ownerProfile.KYC_docs = [
      { type: 'aadhaar', path: req.files['aadhaarFile'][0].path, number: aadhaarNumber },
      { type: 'pan', path: req.files['panFile'][0].path, number: panNumber }
    ];
    if (req.files['gstFile'] && gstNumber) {
      ownerProfile.KYC_docs.push({ type: 'gst', path: req.files['gstFile'][0].path, number: gstNumber });
    }
    if (req.files['passportFile'] && passportNumber) {
      ownerProfile.KYC_docs.push({ type: 'passport', path: req.files['passportFile'][0].path, number: passportNumber });
    }
    if (req.files['drivingFile'] && drivingNumber) {
      ownerProfile.KYC_docs.push({ type: 'driving', path: req.files['drivingFile'][0].path, number: drivingNumber });
    }
    ownerProfile.approval_status = 'pending';
    await ownerProfile.save();
    res.json({ message: 'KYC uploaded, pending approval', docs: ownerProfile.KYC_docs });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GDPR/Data Consent log
router.post('/consent', authenticateJWT, async (req, res) => {
  try {
    const { consent } = req.body;
    if (typeof consent !== 'boolean') return res.status(400).json({ error: 'Consent value required' });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.data_consent = consent;
    user.consent_date = new Date();
    await user.save();
    res.json({ message: 'Consent updated', consent });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    blacklistToken(token);
    logSuspiciousActivity(req, 'User logged out');
  }
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// Get current user info from JWT
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user }); // Wrap user in object
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Refresh JWT token
router.get('/refresh', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Generate new token with 24 hour expiry
    const newToken = jwt.sign(
      { 
        id: user._id, 
        role: user.role || 'user',
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true, 
      token: newToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user'
      }
    });
  } catch (err) {
    res.status(401).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
  }
});

export default router;
