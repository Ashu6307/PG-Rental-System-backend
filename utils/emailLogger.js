import EmailLog from '../models/EmailLog.js';

// Utility function to log emails
export const logEmail = async ({
  recipient,
  recipientName,
  subject,
  emailType,
  status = 'sent',
  errorMessage,
  campaignId,
  campaignName,
  templateUsed,
  userId,
  sentBy,
  metadata = {}
}) => {
  try {
    await EmailLog.create({
      recipient,
      recipientName,
      subject,
      emailType,
      status,
      errorMessage,
      campaignId,
      campaignName,
      templateUsed,
      userId,
      sentBy,
      metadata,
      sentAt: new Date()
    });
  } catch (error) {
    console.error('Failed to log email:', error);
    // Don't throw error as logging shouldn't break email sending
  }
};

// Enhanced sendEmail wrapper with logging
export const sendEmailWithLogging = async ({
  to,
  subject,
  html,
  emailType,
  userId,
  recipientName,
  sentBy,
  campaignId,
  campaignName,
  templateUsed,
  attachmentBuffer,
  metadata = {}
}) => {
  const { sendEmail } = await import('./sendEmail.js');
  
  try {
    // Send email
    const result = await sendEmail({
      to,
      subject,
      html,
      attachmentBuffer
    });

    // Log successful email
    await logEmail({
      recipient: to,
      recipientName,
      subject,
      emailType,
      status: 'sent',
      campaignId,
      campaignName,
      templateUsed,
      userId,
      sentBy,
      metadata
    });

    return { success: true, result };

  } catch (error) {
    // Log failed email
    await logEmail({
      recipient: to,
      recipientName,
      subject,
      emailType,
      status: 'failed',
      errorMessage: error.message,
      campaignId,
      campaignName,
      templateUsed,
      userId,
      sentBy,
      metadata
    });

    throw error; // Re-throw to maintain original error handling
  }
};
