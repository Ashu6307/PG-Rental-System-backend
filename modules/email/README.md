# Enhanced Email System Documentation

## 📧 Email Module Structure

```
backend/modules/email/
├── index.js                    # Main entry point with quick access functions
├── EmailConfig.js              # Configuration, constants and validators
├── EmailService.js             # Core email sending service with logging
├── EmailManager.js             # High-level email management (Recommended)
├── EmailQueue.js               # Queue management for bulk/async emails
├── emailRoutes.js              # API routes for email operations
├── EmailAnalyticsController.js # Analytics and reporting
└── MarketingController.js      # Marketing campaigns and newsletters
```

## 🎯 How to Use (Easy Integration)

### 1. **Simple Email Sending (Recommended)**

```javascript
import EmailManager from '../modules/email/EmailManager.js';
// OR import individual functions
import { sendWelcomeEmail, sendOTPEmail, sendBookingEmail } from '../modules/email/index.js';

// Welcome email
await sendWelcomeEmail(user);

// OTP email
await sendOTPEmail(user, '123456', 'email verification');

// Booking email
await sendBookingEmail(user, booking, 'booking_approved');

// Payment email  
await sendPaymentEmail(user, payment, booking, 'payment_receipt');
```

### 2. **Advanced Usage with Options**

```javascript
// Send with email queue (for better performance)
await EmailManager.sendWelcomeEmail(user, { 
  useQueue: true,
  priority: 10,
  delay: 5000 // 5 seconds delay
});

// Send booking email with additional data
await EmailManager.sendBookingEmail(user, booking, 'booking_approved', {
  specialOffer: '10% discount on next booking',
  supportMessage: 'Call us for any queries'
}, {
  useQueue: true
});
```

### 3. **Marketing Campaigns**

```javascript
// Send newsletter to all subscribers
await EmailManager.sendNewsletter({
  title: 'Monthly Newsletter',
  content: 'Check out our latest offers...',
  ctaText: 'View Offers',
  ctaLink: 'https://yoursite.com/offers'
}, { 
  sentBy: adminUserId,
  useQueue: true 
});

// Send promotional offer to specific audience
await EmailManager.sendPromotionalOffer({
  title: 'Summer Special Offer',
  content: 'Get 20% off on all bookings...',
  offerCode: 'SUMMER20',
  expiryDate: '2025-08-31'
}, 'active_users', { // Target active users only
  sentBy: adminUserId
});
```

### 4. **Scheduled & Behavior-Triggered Emails**

```javascript
// Schedule email for later
await EmailManager.scheduleEmail({
  to: user.email,
  subject: 'Booking Reminder',
  emailType: 'booking_reminder',
  templateName: 'bookingReminder',
  templateData: { name: user.name, bookingDate: '2025-09-01' }
}, '2025-08-30T10:00:00Z');

// Behavior-triggered emails
await EmailManager.sendBehaviorTriggeredEmail(
  userId, 
  'inactive_user', 
  { lastActiveDate: '2025-07-01' }
);
```

## 🔧 Configuration Options

### Email Types Available:
- `welcome` - Welcome new users
- `otp` - OTP verification
- `password_reset` - Password reset requests
- `password_reset_confirmation` - Reset confirmations
- `booking_request` - Booking requests
- `booking_approved` - Booking approvals
- `booking_rejected` - Booking rejections  
- `booking_completed` - Booking completions
- `payment_receipt` - Payment receipts
- `payment_failed` - Payment failures
- `refund_confirmation` - Refund confirmations
- `newsletter` - Newsletters
- `promotional` - Promotional offers
- `seasonal` - Seasonal campaigns
- `retention` - User retention emails

### Target Audience Types:
- `newsletter` - Newsletter subscribers
- `promotional` - Promotional email subscribers
- `active_users` - Recently active users (30 days)
- `inactive_users` - Inactive users (60+ days)
- `new_users` - New users (7 days)
- `pg_users` - PG booking users
- `bike_users` - Bike rental users
- `high_value_users` - High value customers

## 📊 Analytics & Monitoring

### Get Email Analytics
```javascript
// Get email performance for date range
const analytics = await EmailManager.getEmailAnalytics(
  '2025-08-01',
  '2025-08-31',
  { emailType: 'newsletter' }
);

// Get campaign summary
const summary = await EmailManager.getCampaignSummary(campaignId);

// Get system health
const health = await EmailManager.getSystemHealth();

// Get queue status
const queueStatus = await EmailManager.getQueueStatus();
```

### Available Templates
```javascript
const templates = EmailManager.getAvailableTemplates();
console.log(templates);
/*
[
  { type: 'welcome', template: 'userWelcome', subject: '🎉 Welcome...' },
  { type: 'otp', template: 'otpEmail', subject: '🔐 Your OTP Code' },
  ...
]
*/
```

## 🌐 API Endpoints

### Public Endpoints:
- `POST /api/emails/newsletter/subscribe` - Newsletter subscription

### User Endpoints (Authentication Required):
- `GET /api/emails/preferences` - Get email preferences
- `PUT /api/emails/preferences` - Update email preferences

### Admin Endpoints (Admin Authentication Required):
- `POST /api/emails/marketing/newsletter` - Send newsletter
- `POST /api/emails/marketing/promotional` - Send promotional email
- `POST /api/emails/marketing/seasonal` - Send seasonal campaign
- `POST /api/emails/marketing/retention` - Send retention email
- `GET /api/emails/analytics/dashboard` - Analytics dashboard
- `GET /api/emails/analytics/logs` - Email logs
- `GET /api/emails/analytics/campaigns` - Campaign analytics
- `POST /api/emails/send/manual` - Send manual email
- `POST /api/emails/test` - Send test email
- `GET /api/emails/templates` - Get available templates

## ⚡ Performance Features

### Email Queue System:
- **Bulk Processing**: Handles large email campaigns efficiently
- **Rate Limiting**: Prevents email provider limits
- **Retry Logic**: Automatic retry for failed emails
- **Priority Queues**: Important emails get higher priority
- **Background Processing**: Non-blocking email sending

### Batch Processing:
- Processes emails in configurable batches (default: 50 emails/batch)
- Configurable delays between batches (default: 2 seconds)
- Prevents overwhelming email providers

### Error Handling:
- Automatic retry for failed emails (max 3 attempts)
- Comprehensive error logging
- Failed job tracking and retry options

## 📋 Email Logging & Tracking

Every email is automatically logged with:
- Recipient details
- Email type and template used
- Success/failure status
- Timestamp
- Campaign association (if applicable)
- Error details (if failed)

## 🔒 Security Features

### Email Validation:
- Email format validation
- Template name validation
- Email type validation
- Bulk email request validation

### Privacy & Compliance:
- User email preferences respected
- Unsubscribe links in marketing emails
- GDPR compliance ready
- Audit trail for all email activities

## 💡 Best Practices

### 1. **Use Email Manager for Most Operations**
```javascript
// ✅ Recommended
import EmailManager from '../modules/email/EmailManager.js';
await EmailManager.sendWelcomeEmail(user);

// ⚠️ Also works but less features
import { sendWelcomeEmail } from '../modules/email/index.js';
await sendWelcomeEmail(user);
```

### 2. **Use Queue for Bulk Operations**
```javascript
// ✅ For bulk emails, always use queue
await EmailManager.sendNewsletter(data, { useQueue: true });

// ❌ Don't send bulk emails synchronously
```

### 3. **Handle Errors Gracefully**
```javascript
try {
  await EmailManager.sendBookingEmail(user, booking, 'booking_approved');
} catch (error) {
  // Log error but don't break the main flow
  console.error('Email sending failed:', error.message);
  // Continue with booking confirmation logic
}
```

### 4. **Monitor Email Health**
```javascript
// Regularly check system health
const health = await EmailManager.getSystemHealth();
if (!health.isHealthy) {
  // Alert administrators
  console.warn('Email system health issues detected');
}
```

## 🚀 Migration from Old System

### Old Way:
```javascript
// ❌ Old method
import { sendEmail } from '../utils/sendEmail.js';
import emailTemplates from '../utils/emailTemplates.js';

const html = emailTemplates.bookingApproved(data);
await sendEmail({ to: user.email, subject: 'Booking Approved', html });
```

### New Way:
```javascript
// ✅ New enhanced method
import EmailManager from '../modules/email/EmailManager.js';

await EmailManager.sendBookingEmail(user, booking, 'booking_approved');
```

## 📈 Performance Improvements

### Before Enhancement:
- ❌ No email queue system
- ❌ No bulk email support
- ❌ No email analytics
- ❌ No retry mechanism
- ❌ No performance monitoring

### After Enhancement:
- ✅ Redis-based email queue
- ✅ Bulk email campaigns
- ✅ Comprehensive analytics
- ✅ Automatic retry for failures
- ✅ Performance monitoring
- ✅ Email preferences management
- ✅ Marketing campaign system
- ✅ Behavior-triggered emails
- ✅ Scheduled email delivery

## 🎯 Conclusion

The enhanced email system provides:
1. **Easy Integration** - Simple function calls for common operations
2. **Advanced Features** - Queue management, analytics, campaigns
3. **Better Performance** - Bulk processing, retry logic, background jobs
4. **Comprehensive Monitoring** - Health checks, analytics, logging
5. **Scalability** - Handles high-volume email operations
6. **User Experience** - Professional templates, personalization, preferences

This system is production-ready and can handle the email needs of a growing platform efficiently.
