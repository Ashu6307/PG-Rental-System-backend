// Central Email Service - Single point of control
import { sendEmail } from '../../utils/sendEmail.js';
import emailTemplates from '../../utils/emailTemplates.js';
import EmailLog from '../../models/EmailLog.js';
import EmailCampaign from '../../models/EmailCampaign.js';
import User from '../../models/User.js';

class EmailService {
  // Single method to send any email with automatic logging
  async sendEmailWithLogging({
    to,
    subject,
    emailType,
    templateName,
    templateData,
    userId,
    campaignId = null,
    sentBy = null,
    attachmentBuffer = null
  }) {
    try {
      // Generate HTML from template
      const html = emailTemplates[templateName](templateData);
      
      // Send email
      await sendEmail({ to, subject, html, attachmentBuffer });

      // Log success
      await this.logEmail({
        recipient: to,
        recipientName: templateData.name,
        subject,
        emailType,
        status: 'sent',
        campaignId,
        templateUsed: templateName,
        userId,
        sentBy
      });

      return { success: true };

    } catch (error) {
      // Log failure
      await this.logEmail({
        recipient: to,
        recipientName: templateData.name,
        subject,
        emailType,
        status: 'failed',
        errorMessage: error.message,
        campaignId,
        templateUsed: templateName,
        userId,
        sentBy
      });

      throw error;
    }
  }

  // Bulk email sender with batching
  async sendBulkEmails({
    users,
    subject,
    emailType,
    templateName,
    templateData,
    campaignName,
    sentBy,
    batchSize = 50,
    delayBetweenBatches = 2000
  }) {
    // Create campaign
    const campaign = new EmailCampaign({
      name: campaignName,
      type: emailType,
      subject,
      status: 'sending',
      targetAudience: 'subscribers_only',
      content: { templateData },
      createdBy: sentBy,
      sentAt: new Date(),
      stats: { totalRecipients: users.length }
    });
    await campaign.save();

    let successCount = 0;
    let failureCount = 0;

    // Process in batches
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      const promises = batch.map(async (user) => {
        try {
          await this.sendEmailWithLogging({
            to: user.email,
            subject,
            emailType,
            templateName,
            templateData: { ...templateData, name: user.name },
            userId: user._id,
            campaignId: campaign._id.toString(),
            sentBy
          });
          successCount++;
        } catch (error) {
          failureCount++;
        }
      });

      await Promise.allSettled(promises);
      
      // Delay between batches
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    // Update campaign stats
    campaign.stats.emailsSent = successCount;
    campaign.stats.emailsFailed = failureCount;
    campaign.status = 'sent';
    await campaign.save();

    return {
      campaignId: campaign._id,
      totalUsers: users.length,
      successCount,
      failureCount
    };
  }

  // Get targeted users based on criteria
  async getTargetedUsers(targetType, targetLocation = null) {
    let query = { 
      emailVerified: true,
      'emailPreferences.promotional': { $ne: false }
    };

    switch (targetType) {
      case 'newsletter':
        query['emailPreferences.newsletter'] = { $ne: false };
        break;
      case 'inactive':
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        query.lastBookingDate = { $lt: sixtyDaysAgo };
        break;
      case 'active':
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        query.lastBookingDate = { $gte: thirtyDaysAgo };
        break;
      case 'new':
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        query.createdAt = { $gte: sevenDaysAgo };
        break;
    }

    if (targetLocation) {
      query['address.city'] = new RegExp(targetLocation, 'i');
    }

    return await User.find(query).select('name email');
  }

  // Email logging utility
  async logEmail(logData) {
    try {
      await EmailLog.create({
        ...logData,
        sentAt: new Date()
      });
    } catch (error) {
      console.error('Email logging failed:', error);
    }
  }

  // Quick send methods for common emails
  async sendWelcomeEmail(user) {
    return this.sendEmailWithLogging({
      to: user.email,
      subject: '🎉 Welcome to PG & Room Rental Platform!',
      emailType: 'welcome',
      templateName: 'userWelcome',
      templateData: {
        name: user.name,
        role: user.role,
        email: user.email
      },
      userId: user._id
    });
  }

  async sendOTPEmail(user, otp, purpose = 'email verification') {
    return this.sendEmailWithLogging({
      to: user.email,
      subject: '🔐 Your OTP Code - PG & Room Rental',
      emailType: 'otp',
      templateName: 'otpEmail',
      templateData: {
        name: user.name,
        email: user.email,
        role: user.role,
        otp: otp,
        purpose: purpose
      },
      userId: user._id
    });
  }

  async sendPasswordResetConfirmation(user, resetDetails) {
    return this.sendEmailWithLogging({
      to: user.email,
      subject: '🔐 Password Reset Successful - PG & Room Rental',
      emailType: 'password_reset_confirmation',
      templateName: 'passwordResetConfirmation',
      templateData: {
        name: user.name,
        email: user.email,
        role: user.role,
        ...resetDetails
      },
      userId: user._id
    });
  }

  async sendBookingEmail(user, booking, emailType, additionalData = {}) {
    const templateMap = {
      'booking_request': 'bookingRequested',
      'booking_approved': 'bookingApproved',
      'booking_rejected': 'bookingRejected',
      'booking_completed': 'bookingCompleted'
    };

    return this.sendEmailWithLogging({
      to: user.email,
      subject: this.getBookingEmailSubject(emailType, booking.item_type),
      emailType,
      templateName: templateMap[emailType],
      templateData: {
        name: user.name,
        ...this.getBookingTemplateData(booking),
        ...additionalData
      },
      userId: user._id
    });
  }

  async sendPaymentEmail(user, payment, booking, emailType) {
    const templateMap = {
      'payment_receipt': 'paymentReceipt',
      'payment_failed': 'paymentFailed',
      'refund_confirmation': 'refundConfirmation'
    };

    return this.sendEmailWithLogging({
      to: user.email,
      subject: this.getPaymentEmailSubject(emailType),
      emailType,
      templateName: templateMap[emailType],
      templateData: {
        name: user.name,
        email: user.email,
        ...this.getPaymentTemplateData(payment, booking)
      },
      userId: user._id
    });
  }

  // Helper methods
  getBookingEmailSubject(emailType, itemType) {
    const subjects = {
      'booking_request': `📝 ${itemType} Booking Request Submitted`,
      'booking_approved': `✅ ${itemType} Booking Approved`,
      'booking_rejected': `❌ ${itemType} Booking Update`,
      'booking_completed': `✅ ${itemType} Booking Completed`
    };
    return subjects[emailType] + ' - PG & Room Rental';
  }

  getPaymentEmailSubject(emailType) {
    const subjects = {
      'payment_receipt': '💳 Payment Receipt',
      'payment_failed': '❌ Payment Failed',
      'refund_confirmation': '💰 Refund Initiated'
    };
    return subjects[emailType] + ' - PG & Room Rental';
  }

  getBookingTemplateData(booking) {
    return {
      itemType: booking.item_type,
      itemName: booking.item_name,
      bookingId: booking.bookingId || booking._id.toString(),
      itemAddress: booking.item_address || 'Address not provided',
      startDate: booking.start_date ? new Date(booking.start_date).toLocaleDateString() : null,
      endDate: booking.end_date ? new Date(booking.end_date).toLocaleDateString() : null,
      bookingDate: new Date(booking.createdAt).toLocaleDateString()
    };
  }

  getPaymentTemplateData(payment, booking) {
    return {
      paymentId: payment._id.toString(),
      amount: payment.amount,
      gst: (payment.amount * 0.18).toFixed(2),
      totalAmount: (payment.amount * 1.18).toFixed(2),
      itemType: booking?.item_type || 'Service',
      itemName: booking?.item_name || 'Booking Service',
      bookingId: booking?._id.toString() || 'N/A',
      paymentDate: new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      paymentMethod: payment.method || 'Online',
      transactionId: payment.transaction_id || payment._id.toString()
    };
  }
}

// Export singleton instance
export default new EmailService();
