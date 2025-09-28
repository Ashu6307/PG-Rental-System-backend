// Email Configuration & Constants
export const EMAIL_CONFIG = {
  // Batch processing settings
  BATCH_SIZE: 50,
  DELAY_BETWEEN_BATCHES: 2000, // 2 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000, // 5 seconds

  // Email types
  TYPES: {
    WELCOME: 'welcome',
    OTP: 'otp',
    PASSWORD_RESET: 'password_reset',
    PASSWORD_RESET_CONFIRMATION: 'password_reset_confirmation',
    BOOKING_REQUEST: 'booking_request',
    BOOKING_APPROVED: 'booking_approved',
    BOOKING_REJECTED: 'booking_rejected',
    BOOKING_COMPLETED: 'booking_completed',
    PAYMENT_RECEIPT: 'payment_receipt',
    PAYMENT_FAILED: 'payment_failed',
    REFUND_CONFIRMATION: 'refund_confirmation',
    NEWSLETTER: 'newsletter',
    PROMOTIONAL: 'promotional',
    SEASONAL: 'seasonal',
    RETENTION: 'retention',
    MANUAL: 'manual',
    TEST: 'test'
  },

  // Template mapping
  TEMPLATES: {
    welcome: 'userWelcome',
    otp: 'otpVerification',
    password_reset: 'passwordReset',
    password_reset_confirmation: 'passwordResetConfirmation',
    booking_request: 'bookingRequested',
    booking_approved: 'bookingApproved',
    booking_rejected: 'bookingRejected',
    booking_completed: 'bookingCompleted',
    payment_receipt: 'paymentReceipt',
    payment_failed: 'paymentFailed',
    refund_confirmation: 'refundConfirmation',
    newsletter: 'newsletter',
    promotional: 'promotional',
    seasonal: 'seasonalCampaign',
    retention: 'retention'
  },

  // Subject prefixes
  SUBJECTS: {
    welcome: '🎉 Welcome to Property Rental Platform!',
    otp: '🔐 Your OTP Code',
    password_reset: '🔐 Password Reset Request',
    password_reset_confirmation: '✅ Password Reset Successful',
    booking_request: '📝 Booking Request Submitted',
    booking_approved: '✅ Booking Approved',
    booking_rejected: '❌ Booking Update',
    booking_completed: '✅ Booking Completed',
    payment_receipt: '💳 Payment Receipt',
    payment_failed: '❌ Payment Failed',
    refund_confirmation: '💰 Refund Initiated',
    newsletter: '📧 Newsletter',
    promotional: '🎁 Special Offer',
    seasonal: '🌟 Seasonal Offer',
    retention: '💝 We Miss You!'
  },

  // Target audience types
  TARGET_TYPES: {
    ALL: 'all',
    NEWSLETTER_SUBSCRIBERS: 'newsletter',
    PROMOTIONAL_SUBSCRIBERS: 'promotional',
    ACTIVE_USERS: 'active',
    INACTIVE_USERS: 'inactive',
    NEW_USERS: 'new',
    PG_USERS: 'pg_users',
    ROOM_USERS: 'room_users',
    FLAT_USERS: 'flat_users',
    HIGH_VALUE_USERS: 'high_value'
  },

  // Email status
  STATUS: {
    PENDING: 'pending',
    SENDING: 'sending',
    SENT: 'sent',
    FAILED: 'failed',
    RETRYING: 'retrying'
  }
};

// Email validation utilities
export const EMAIL_VALIDATORS = {
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidTemplate: (templateName) => {
    return Object.values(EMAIL_CONFIG.TEMPLATES).includes(templateName);
  },

  isValidEmailType: (emailType) => {
    return Object.values(EMAIL_CONFIG.TYPES).includes(emailType);
  },

  validateBulkEmailRequest: (request) => {
    const errors = [];
    
    if (!request.subject) errors.push('Subject is required');
    if (!request.templateName) errors.push('Template name is required');
    if (!request.emailType) errors.push('Email type is required');
    if (!request.targetType) errors.push('Target type is required');
    
    if (request.templateName && !EMAIL_VALIDATORS.isValidTemplate(request.templateName)) {
      errors.push('Invalid template name');
    }
    
    if (request.emailType && !EMAIL_VALIDATORS.isValidEmailType(request.emailType)) {
      errors.push('Invalid email type');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// Common email template data generators
export const EMAIL_DATA_GENERATORS = {
  userWelcome: (user) => ({
    name: user.name,
    email: user.email,
    role: user.role,
    platformName: 'Property Rental Platform'
  }),

  otpEmail: (user, otp, purpose = 'verification') => ({
    name: user.name,
    email: user.email,
    role: user.role,
    otp: otp,
    purpose: purpose,
    expiryMinutes: 10
  }),

  bookingEmail: (user, booking, additionalData = {}) => ({
    name: user.name,
    email: user.email,
    itemType: booking.item_type,
    itemName: booking.item_name,
    bookingId: booking.bookingId || booking._id.toString(),
    itemAddress: booking.item_address || 'Address not provided',
    startDate: booking.start_date ? new Date(booking.start_date).toLocaleDateString() : null,
    endDate: booking.end_date ? new Date(booking.end_date).toLocaleDateString() : null,
    bookingDate: new Date(booking.createdAt).toLocaleDateString(),
    amount: booking.amount || 0,
    ...additionalData
  }),

  paymentEmail: (user, payment, booking) => ({
    name: user.name,
    email: user.email,
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
  }),

  marketingEmail: (user, campaign) => ({
    name: user.name,
    email: user.email,
    title: campaign.title,
    content: campaign.content,
    ctaText: campaign.ctaText || 'Learn More',
    ctaLink: campaign.ctaLink || '#',
    unsubscribeLink: `${process.env.FRONTEND_URL}/unsubscribe?email=${user.email}`
  })
};

export default {
  EMAIL_CONFIG,
  EMAIL_VALIDATORS,
  EMAIL_DATA_GENERATORS
};
