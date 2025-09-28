// Enhanced Email Manager - Central control for all email operations
import EmailService from './EmailService.js';
import EmailQueue from './EmailQueue.js';
import { EMAIL_CONFIG, EMAIL_VALIDATORS, EMAIL_DATA_GENERATORS } from './EmailConfig.js';
import User from '../../models/User.js';
import EmailLog from '../../models/EmailLog.js';
import EmailCampaign from '../../models/EmailCampaign.js';

class EmailManager {
  constructor() {
    this.service = EmailService;
    this.queue = EmailQueue;
    this.config = EMAIL_CONFIG;
  }

  // ============== QUICK SEND METHODS ==============
  
  // Send welcome email
  async sendWelcomeEmail(user, options = {}) {
    const emailData = {
      to: user.email,
      subject: EMAIL_CONFIG.SUBJECTS.welcome,
      emailType: EMAIL_CONFIG.TYPES.WELCOME,
      templateName: EMAIL_CONFIG.TEMPLATES.welcome,
      templateData: EMAIL_DATA_GENERATORS.userWelcome(user),
      userId: user._id
    };

    if (options.useQueue) {
      return await this.queue.addSingleEmail(emailData, options);
    }
    return await this.service.sendEmailWithLogging(emailData);
  }

  // Send OTP email
  async sendOTPEmail(user, otp, purpose = 'verification', options = {}) {
    const emailData = {
      to: user.email,
      subject: `${EMAIL_CONFIG.SUBJECTS.otp} - ${purpose}`,
      emailType: EMAIL_CONFIG.TYPES.OTP,
      templateName: EMAIL_CONFIG.TEMPLATES.otp,
      templateData: EMAIL_DATA_GENERATORS.otpEmail(user, otp, purpose),
      userId: user._id
    };

    if (options.useQueue) {
      return await this.queue.addSingleEmail(emailData, { priority: 10, ...options });
    }
    return await this.service.sendEmailWithLogging(emailData);
  }

  // Send booking email
  async sendBookingEmail(user, booking, emailType, additionalData = {}, options = {}) {
    if (!EMAIL_CONFIG.TEMPLATES[emailType]) {
      throw new Error(`Invalid booking email type: ${emailType}`);
    }

    const emailData = {
      to: user.email,
      subject: this._getBookingSubject(emailType, booking.item_type),
      emailType,
      templateName: EMAIL_CONFIG.TEMPLATES[emailType],
      templateData: EMAIL_DATA_GENERATORS.bookingEmail(user, booking, additionalData),
      userId: user._id
    };

    if (options.useQueue) {
      return await this.queue.addSingleEmail(emailData, options);
    }
    return await this.service.sendEmailWithLogging(emailData);
  }

  // Send payment email
  async sendPaymentEmail(user, payment, booking, emailType, options = {}) {
    if (!EMAIL_CONFIG.TEMPLATES[emailType]) {
      throw new Error(`Invalid payment email type: ${emailType}`);
    }

    const emailData = {
      to: user.email,
      subject: `${EMAIL_CONFIG.SUBJECTS[emailType]} - Property Rental`,
      emailType,
      templateName: EMAIL_CONFIG.TEMPLATES[emailType],
      templateData: EMAIL_DATA_GENERATORS.paymentEmail(user, payment, booking),
      userId: user._id
    };

    if (options.useQueue) {
      return await this.queue.addSingleEmail(emailData, options);
    }
    return await this.service.sendEmailWithLogging(emailData);
  }

  // ============== BULK & CAMPAIGN METHODS ==============

  // Send newsletter to subscribers
  async sendNewsletter(campaignData, options = {}) {
    const users = await this._getTargetedUsers(EMAIL_CONFIG.TARGET_TYPES.NEWSLETTER_SUBSCRIBERS);
    
    const bulkData = {
      users,
      subject: campaignData.subject || `${EMAIL_CONFIG.SUBJECTS.newsletter} - ${campaignData.title}`,
      emailType: EMAIL_CONFIG.TYPES.NEWSLETTER,
      templateName: EMAIL_CONFIG.TEMPLATES.newsletter,
      templateData: campaignData,
      campaignName: `Newsletter: ${campaignData.title}`,
      sentBy: options.sentBy
    };

    if (options.useQueue) {
      return await this.queue.addBulkEmail(bulkData, options);
    }
    return await this.service.sendBulkEmails(bulkData);
  }

  // Send promotional offer
  async sendPromotionalOffer(campaignData, targetType = EMAIL_CONFIG.TARGET_TYPES.PROMOTIONAL_SUBSCRIBERS, options = {}) {
    const users = await this._getTargetedUsers(targetType, campaignData.targetLocation);
    
    const bulkData = {
      users,
      subject: campaignData.subject || `${EMAIL_CONFIG.SUBJECTS.promotional} - ${campaignData.title}`,
      emailType: EMAIL_CONFIG.TYPES.PROMOTIONAL,
      templateName: EMAIL_CONFIG.TEMPLATES.promotional,
      templateData: campaignData,
      campaignName: `Promotional: ${campaignData.title}`,
      sentBy: options.sentBy
    };

    if (options.useQueue) {
      return await this.queue.addBulkEmail(bulkData, options);
    }
    return await this.service.sendBulkEmails(bulkData);
  }

  // Send retention email to inactive users
  async sendRetentionEmail(campaignData, options = {}) {
    const users = await this._getTargetedUsers(EMAIL_CONFIG.TARGET_TYPES.INACTIVE_USERS);
    
    const bulkData = {
      users,
      subject: campaignData.subject || `${EMAIL_CONFIG.SUBJECTS.retention} - Come Back!`,
      emailType: EMAIL_CONFIG.TYPES.RETENTION,
      templateName: EMAIL_CONFIG.TEMPLATES.retention,
      templateData: campaignData,
      campaignName: `Retention: ${campaignData.title}`,
      sentBy: options.sentBy
    };

    if (options.useQueue) {
      return await this.queue.addBulkEmail(bulkData, options);
    }
    return await this.service.sendBulkEmails(bulkData);
  }

  // ============== ADVANCED FEATURES ==============

  // Send automated email based on user behavior
  async sendBehaviorTriggeredEmail(userId, triggerType, additionalData = {}) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const triggerMap = {
      'signup_welcome': () => this.sendWelcomeEmail(user),
      'booking_reminder': () => this._sendBookingReminder(user, additionalData),
      'payment_reminder': () => this._sendPaymentReminder(user, additionalData),
      'inactive_user': () => this._sendInactiveUserEmail(user),
      'birthday_wish': () => this._sendBirthdayEmail(user)
    };

    const triggerFunction = triggerMap[triggerType];
    if (!triggerFunction) {
      throw new Error(`Unknown trigger type: ${triggerType}`);
    }

    return await triggerFunction();
  }

  // Schedule email for later sending
  async scheduleEmail(emailData, scheduledAt, options = {}) {
    const delay = new Date(scheduledAt).getTime() - Date.now();
    
    if (delay <= 0) {
      throw new Error('Scheduled time must be in the future');
    }

    return await this.queue.addSingleEmail(emailData, {
      delay,
      ...options
    });
  }

  // Send personalized email with dynamic content
  async sendPersonalizedEmail(userId, templateName, personalizedData, options = {}) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Merge user data with personalized data
    const templateData = {
      ...EMAIL_DATA_GENERATORS.userWelcome(user),
      ...personalizedData
    };

    const emailData = {
      to: user.email,
      subject: personalizedData.subject || 'Personalized Message',
      emailType: EMAIL_CONFIG.TYPES.MANUAL,
      templateName,
      templateData,
      userId: user._id,
      sentBy: options.sentBy
    };

    if (options.useQueue) {
      return await this.queue.addSingleEmail(emailData, options);
    }
    return await this.service.sendEmailWithLogging(emailData);
  }

  // ============== ANALYTICS & MONITORING ==============

  // Get email performance analytics
  async getEmailAnalytics(startDate, endDate, filters = {}) {
    const matchConditions = {
      sentAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (filters.emailType) matchConditions.emailType = filters.emailType;
    if (filters.status) matchConditions.status = filters.status;
    if (filters.campaignId) matchConditions.campaignId = filters.campaignId;

    const analytics = await EmailLog.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$sentAt' } },
            emailType: '$emailType',
            status: '$status'
          },
          count: { $sum: 1 },
          uniqueRecipients: { $addToSet: '$recipient' }
        }
      },
      {
        $group: {
          _id: {
            date: '$_id.date',
            emailType: '$_id.emailType'
          },
          totalSent: {
            $sum: { $cond: [{ $eq: ['$_id.status', 'sent'] }, '$count', 0] }
          },
          totalFailed: {
            $sum: { $cond: [{ $eq: ['$_id.status', 'failed'] }, '$count', 0] }
          },
          uniqueRecipients: {
            $sum: { $size: '$uniqueRecipients' }
          }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    return analytics;
  }

  // Get campaign performance summary
  async getCampaignSummary(campaignId) {
    const campaign = await EmailCampaign.findById(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    const emailLogs = await EmailLog.find({ campaignId }).select('status sentAt');
    
    const stats = emailLogs.reduce((acc, log) => {
      acc[log.status] = (acc[log.status] || 0) + 1;
      return acc;
    }, {});

    return {
      campaign: campaign.toObject(),
      emailStats: stats,
      successRate: ((stats.sent || 0) / emailLogs.length * 100).toFixed(2),
      totalEmails: emailLogs.length
    };
  }

  // ============== UTILITY METHODS ==============

  // Get available email templates
  getAvailableTemplates() {
    return Object.entries(EMAIL_CONFIG.TEMPLATES).map(([type, template]) => ({
      type,
      template,
      subject: EMAIL_CONFIG.SUBJECTS[type] || 'Custom Subject'
    }));
  }

  // Validate email request
  validateEmailRequest(request) {
    return EMAIL_VALIDATORS.validateBulkEmailRequest(request);
  }

  // Get queue status
  async getQueueStatus() {
    return await this.queue.getQueueStats();
  }

  // Get system health
  async getSystemHealth() {
    const queueHealth = await this.queue.getHealthStatus();
    const recentLogs = await EmailLog.find()
      .sort({ sentAt: -1 })
      .limit(10)
      .select('status emailType sentAt');

    return {
      queue: queueHealth,
      recentActivity: recentLogs,
      isHealthy: queueHealth.isHealthy && recentLogs.filter(log => log.status === 'failed').length < 3
    };
  }

  // ============== PRIVATE HELPER METHODS ==============

  async _getTargetedUsers(targetType, targetLocation = null) {
    return await this.service.getTargetedUsers(targetType, targetLocation);
  }

  _getBookingSubject(emailType, itemType) {
    const typeMap = {
      'booking_request': `📝 ${itemType} Booking Request Submitted`,
      'booking_approved': `✅ ${itemType} Booking Approved`,
      'booking_rejected': `❌ ${itemType} Booking Update`,
      'booking_completed': `✅ ${itemType} Booking Completed`
    };
    return (typeMap[emailType] || 'Booking Update') + ' - Property Rental';
  }

  async _sendBookingReminder(user, data) {
    // Implementation for booking reminder
    return await this.sendPersonalizedEmail(
      user._id,
      'bookingReminder',
      {
        subject: '⏰ Booking Reminder - Property Rental',
        ...data
      }
    );
  }

  async _sendPaymentReminder(user, data) {
    // Implementation for payment reminder
    return await this.sendPersonalizedEmail(
      user._id,
      'paymentReminder',
      {
        subject: '💳 Payment Reminder - Property Rental',
        ...data
      }
    );
  }

  async _sendInactiveUserEmail(user) {
    // Implementation for inactive user email
    return await this.sendRetentionEmail({
      title: 'We Miss You!',
      content: 'Come back and explore our latest offers.'
    });
  }

  async _sendBirthdayEmail(user) {
    // Implementation for birthday email
    return await this.sendPersonalizedEmail(
      user._id,
      'promotional',
      {
        subject: '🎉 Happy Birthday! Special Offer Inside',
        title: 'Happy Birthday!',
        content: 'Celebrate with a special discount on your next booking.'
      }
    );
  }
}

// Export singleton instance
export default new EmailManager();
