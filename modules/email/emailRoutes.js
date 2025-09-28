// Email Routes - Centralized routing for email module
import express from 'express';
import EmailService from './EmailService.js';
import MarketingController from './MarketingController.js';
import EmailAnalyticsController from './EmailAnalyticsController.js';
import { authenticateJWT } from '../../middleware/auth.js';

const router = express.Router();

// Admin authentication middleware
const adminAuth = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

// User authentication middleware  
const auth = authenticateJWT;

// ============== PUBLIC ROUTES ==============
// Newsletter subscription (no auth required)
router.post('/newsletter/subscribe', MarketingController.subscribeNewsletter);

// ============== AUTHENTICATED ROUTES ==============
// Email preferences (any authenticated user)
router.put('/preferences', auth, async (req, res) => {
  try {
    const { newsletter, promotional } = req.body;
    
    req.user.emailPreferences = {
      newsletter: newsletter !== false,
      promotional: promotional !== false
    };
    
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Email preferences updated successfully',
      preferences: req.user.emailPreferences
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to update preferences', 
      details: error.message 
    });
  }
});

// Get user's email preferences
router.get('/preferences', auth, (req, res) => {
  res.json({
    success: true,
    preferences: req.user.emailPreferences || {
      newsletter: true,
      promotional: true
    }
  });
});

// ============== ADMIN ROUTES ==============
// Marketing campaigns
router.post('/marketing/newsletter', adminAuth, MarketingController.sendNewsletter);
router.post('/marketing/promotional', adminAuth, MarketingController.sendPromotionalOffer);
router.post('/marketing/seasonal', adminAuth, MarketingController.sendSeasonalCampaign);
router.post('/marketing/retention', adminAuth, MarketingController.sendRetentionEmail);

// Campaign performance
router.get('/marketing/campaigns', adminAuth, MarketingController.getCampaignPerformance);

// Email analytics dashboard
router.get('/analytics/dashboard', adminAuth, EmailAnalyticsController.getDashboard);
router.get('/analytics/logs', adminAuth, EmailAnalyticsController.getEmailLogs);
router.get('/analytics/campaigns', adminAuth, EmailAnalyticsController.getCampaignAnalytics);
router.get('/analytics/stats', adminAuth, EmailAnalyticsController.getEmailStats);
router.get('/analytics/preferences', adminAuth, EmailAnalyticsController.getUserPreferencesStats);

// Manual email sending (admin only)
router.post('/send/manual', adminAuth, async (req, res) => {
  try {
    const { 
      email, 
      subject, 
      templateName, 
      templateData, 
      emailType = 'manual' 
    } = req.body;

    // Validation
    if (!email || !subject || !templateName) {
      return res.status(400).json({ 
        error: 'Email, subject, and template name are required' 
      });
    }

    await EmailService.sendEmailWithLogging({
      to: email,
      subject,
      emailType,
      templateName,
      templateData: templateData || {},
      sentBy: req.user._id
    });

    res.json({
      success: true,
      message: 'Email sent successfully'
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to send email', 
      details: error.message 
    });
  }
});

// Test email functionality
router.post('/test', adminAuth, async (req, res) => {
  try {
    const { testType = 'welcome' } = req.body;
    
    const testTemplates = {
      welcome: {
        subject: '🎉 Test Welcome Email',
        templateName: 'userWelcome',
        templateData: {
          name: 'Test User',
          role: 'user',
          email: req.user.email
        }
      },
      booking: {
        subject: '📝 Test Booking Email',
        templateName: 'bookingRequested',
        templateData: {
          name: 'Test User',
          itemType: 'PG',
          itemName: 'Test PG',
          bookingId: 'TEST123',
          itemAddress: 'Test Address, Test City',
          bookingDate: new Date().toLocaleDateString()
        }
      },
      newsletter: {
        subject: '📧 Test Newsletter',
        templateName: 'newsletter',
        templateData: {
          name: 'Test User',
          title: 'Test Newsletter',
          content: 'This is a test newsletter content.',
          ctaText: 'View More',
          ctaLink: '#'
        }
      }
    };

    const template = testTemplates[testType];
    if (!template) {
      return res.status(400).json({ error: 'Invalid test type' });
    }

    await EmailService.sendEmailWithLogging({
      to: req.user.email,
      subject: template.subject,
      emailType: 'test',
      templateName: template.templateName,
      templateData: template.templateData,
      sentBy: req.user._id
    });

    res.json({
      success: true,
      message: `Test ${testType} email sent to ${req.user.email}`
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to send test email', 
      details: error.message 
    });
  }
});

// Get available email templates
router.get('/templates', adminAuth, (req, res) => {
  const templates = [
    { name: 'userWelcome', description: 'Welcome email for new users' },
    { name: 'otpEmail', description: 'OTP verification email' },
    { name: 'passwordResetConfirmation', description: 'Password reset confirmation' },
    { name: 'bookingRequested', description: 'Booking request submitted' },
    { name: 'bookingApproved', description: 'PG booking approved' },
    { name: 'bookingRejected', description: 'Booking rejected' },
    { name: 'bookingCompleted', description: 'Booking completed' },
    { name: 'paymentReceipt', description: 'Payment receipt' },
    { name: 'paymentFailed', description: 'Payment failed notification' },
    { name: 'refundConfirmation', description: 'Refund confirmation' },
    { name: 'newsletter', description: 'Newsletter template' },
    { name: 'newsletterSignup', description: 'Newsletter signup confirmation' },
    { name: 'promotional', description: 'Promotional offer template' },
    { name: 'seasonalCampaign', description: 'Seasonal campaign template' },
    { name: 'retention', description: 'User retention email' }
  ];

  res.json({
    success: true,
    templates
  });
});

export default router;
