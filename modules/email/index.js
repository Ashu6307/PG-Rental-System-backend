// Email Module Index - Main entry point for all email functionality
// Enhanced Email System with Queue Management and Analytics

// Core Services
export { default as EmailService } from './EmailService.js';
export { default as EmailManager } from './EmailManager.js';
export { default as EmailQueue } from './EmailQueue.js';

// Controllers
export { default as MarketingController } from './MarketingController.js';
export { default as EmailAnalyticsController } from './EmailAnalyticsController.js';

// Routes & Configuration
export { default as emailRoutes } from './emailRoutes.js';
export { EMAIL_CONFIG, EMAIL_VALIDATORS, EMAIL_DATA_GENERATORS } from './EmailConfig.js';

// Main Email Manager Instance (Recommended way to use)
import EmailManager from './EmailManager.js';

// Quick access functions for common email operations (Easy Integration)
export const sendWelcomeEmail = (user, options = {}) => 
  EmailManager.sendWelcomeEmail(user, options);

export const sendOTPEmail = (user, otp, purpose = 'verification', options = {}) => 
  EmailManager.sendOTPEmail(user, otp, purpose, options);

export const sendPasswordResetConfirmation = (user, resetDetails, options = {}) => 
  EmailManager.sendPersonalizedEmail(user._id, 'passwordResetConfirmation', resetDetails, options);

export const sendBookingEmail = (user, booking, emailType, additionalData = {}, options = {}) => 
  EmailManager.sendBookingEmail(user, booking, emailType, additionalData, options);

export const sendPaymentEmail = (user, payment, booking, emailType, options = {}) => 
  EmailManager.sendPaymentEmail(user, payment, booking, emailType, options);

// Advanced email functions
export const sendNewsletter = (campaignData, options = {}) =>
  EmailManager.sendNewsletter(campaignData, options);

export const sendPromotionalOffer = (campaignData, targetType, options = {}) =>
  EmailManager.sendPromotionalOffer(campaignData, targetType, options);

export const sendRetentionEmail = (campaignData, options = {}) =>
  EmailManager.sendRetentionEmail(campaignData, options);

export const scheduleEmail = (emailData, scheduledAt, options = {}) =>
  EmailManager.scheduleEmail(emailData, scheduledAt, options);

export const sendBehaviorTriggeredEmail = (userId, triggerType, additionalData = {}) =>
  EmailManager.sendBehaviorTriggeredEmail(userId, triggerType, additionalData);

// Analytics functions
export const getEmailAnalytics = (startDate, endDate, filters = {}) =>
  EmailManager.getEmailAnalytics(startDate, endDate, filters);

export const getCampaignSummary = (campaignId) =>
  EmailManager.getCampaignSummary(campaignId);

export const getSystemHealth = () =>
  EmailManager.getSystemHealth();

export const getQueueStatus = () =>
  EmailManager.getQueueStatus();

// Utility functions
export const getAvailableTemplates = () =>
  EmailManager.getAvailableTemplates();

export const validateEmailRequest = (request) =>
  EmailManager.validateEmailRequest(request);

// Export the main manager for advanced usage
export default EmailManager;
