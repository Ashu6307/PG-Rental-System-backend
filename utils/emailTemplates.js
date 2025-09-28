// Professional Email Templates - Industry Standard
const createEmailTemplate = (content, headerColor = '#1f2937') => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PG & Room Rental System</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; color: #374151; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border-radius: 12px; overflow: hidden; }
        .header { background: linear-gradient(135deg, ${headerColor} 0%, #374151 100%); padding: 30px; text-align: center; color: white; }
        .logo { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 8px; }
        .tagline { font-size: 14px; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .title { font-size: 24px; font-weight: 600; color: #1f2937; margin-bottom: 20px; }
        .text { font-size: 16px; margin-bottom: 16px; color: #4b5563; }
        .highlight { color: ${headerColor}; font-weight: 600; }
        .success { color: #059669; font-weight: 600; }
        .danger { color: #dc2626; font-weight: 600; }
        .warning { color: #d97706; font-weight: 600; }
        .info-box { background: #f3f4f6; border-left: 4px solid ${headerColor}; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .button { display: inline-block; background: ${headerColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; transition: all 0.3s ease; }
        .button:hover { background: #374151; transform: translateY(-1px); }
        .otp-code { font-size: 32px; font-weight: 700; color: ${headerColor}; text-align: center; background: #f8fafc; padding: 20px; border-radius: 8px; letter-spacing: 4px; margin: 20px 0; border: 2px dashed ${headerColor}; }
        .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer-text { font-size: 14px; color: #6b7280; margin-bottom: 10px; }
        .social-links { margin: 20px 0; }
        .social-links a { color: #6b7280; text-decoration: none; margin: 0 10px; }
        .divider { height: 1px; background: linear-gradient(to right, transparent, #e5e7eb, transparent); margin: 30px 0; }
        @media (max-width: 600px) {
            .container { margin: 10px; border-radius: 8px; }
            .content { padding: 30px 20px; }
            .header { padding: 25px 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏠 PG & Room Rental</div>
            <div class="tagline">Your Trusted Accommodation Partner</div>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <div class="footer-text">
                <strong>PG & Room Rental System</strong><br>
                Making accommodation and transportation easy & reliable
            </div>
            <div class="social-links">
                <a href="#">📧 Support</a> | 
                <a href="#">📱 Mobile App</a> | 
                <a href="#">🌐 Website</a>
            </div>
            <div class="footer-text" style="font-size: 12px; margin-top: 15px;">
                © 2025 PG & Room Rental System. All rights reserved.<br>
                This email was sent to you as a registered user of our platform.
            </div>
        </div>
    </div>
</body>
</html>
`;

const emailTemplates = {
  // OTP Verification Template
  otpVerification: ({ name, email, role, otp, purpose = 'verification' }) => createEmailTemplate(`
    <div class="title">🔐 Email Verification Required</div>
    <div class="text">Hello <span class="highlight">${name || 'User'}</span>,</div>
    <div class="text">
        We received a request for ${purpose} for your <strong>${role}</strong> account associated with 
        <span class="highlight">${email}</span>.
    </div>
    
    <div class="info-box">
        <strong>🛡️ Security Notice:</strong> For your account security, please verify your email address using the OTP below.
    </div>
    
    <div class="otp-code">${otp}</div>
    
    <div class="text">
    ⏰ <strong>Important:</strong> This OTP is valid for <span class="warning">5 minutes</span> only.
    </div>
    
    <div class="text">
        If you didn't request this verification, please ignore this email or contact our support team immediately.
    </div>
    
    <div class="divider"></div>
    <div class="text" style="font-size: 14px; color: #6b7280;">
        <strong>Need Help?</strong> Contact our 24/7 support team for assistance.
    </div>
  `, '#3b82f6'),

  // Password Reset Template
  passwordReset: ({ name, email, role, otp }) => createEmailTemplate(`
    <div class="title">🔑 Password Reset Request</div>
    <div class="text">Hello <span class="highlight">${name || 'User'}</span>,</div>
    <div class="text">
        We received a password reset request for your <strong>${role}</strong> account 
        (<span class="highlight">${email}</span>).
    </div>
    
    <div class="info-box">
        <strong>🔒 Reset Instructions:</strong><br>
        1. Use the OTP below to verify your identity<br>
        2. Create a new secure password<br>
        3. Login with your new credentials
    </div>
    
    <div class="otp-code">${otp}</div>
    
    <div class="text">
    ⏰ This OTP expires in <span class="warning">5 minutes</span> for security reasons.
    </div>
    
    <div class="text">
        <strong>🛡️ Security Tip:</strong> If you didn't request this reset, please secure your account immediately and contact support.
    </div>
    
    <div class="divider"></div>
    <div class="text" style="font-size: 14px; color: #6b7280;">
        Remember to use a strong password with uppercase, lowercase, numbers, and special characters.
    </div>
  `, '#dc2626'),

  // Welcome Email Template
  userWelcome: ({ name, role, email }) => createEmailTemplate(`
    <div class="title">🎉 Welcome to PG & Room Rental!</div>
    <div class="text">Dear <span class="highlight">${name}</span>,</div>
    <div class="text">
        Congratulations! Your <strong>${role}</strong> account has been successfully created.
    </div>
    
    <div class="info-box">
        <strong>📧 Account Details:</strong><br>
        Email: <span class="highlight">${email}</span><br>
        Role: <span class="highlight">${role.charAt(0).toUpperCase() + role.slice(1)}</span><br>
        Status: <span class="success">✅ Active</span>
    </div>
    
    <div class="text">
        🚀 <strong>What's Next?</strong>
    </div>
    <div class="text">
        ${role === 'user' ? 
          '• Browse available PGs and rooms<br>• Make your first booking<br>• Complete your profile' :
          role === 'owner' ? 
          '• List your PG properties<br>• Add room rentals<br>• Manage bookings' :
          '• Access admin dashboard<br>• Manage users and owners<br>• Monitor platform activity'
        }
    </div>
    
    <a href="http://localhost:3000/${role}/login" class="button">
        🔗 Access Your Dashboard
    </a>
    
    <div class="divider"></div>
    <div class="text" style="font-size: 14px; color: #6b7280;">
        Questions? Our support team is here to help you get started!
    </div>
  `, '#059669'),

  // Booking Confirmation Templates
  bookingApproved: ({ name, pgName, bookingId, pgAddress, bookingDate }) => createEmailTemplate(`
    <div class="title">✅ PG Booking Approved!</div>
    <div class="text">Dear <span class="highlight">${name}</span>,</div>
    <div class="text">
        Great news! Your PG booking has been <span class="success">approved</span> by the owner.
    </div>
    
    <div class="info-box">
        <strong>📋 Booking Details:</strong><br>
        Booking ID: <span class="highlight">#${bookingId}</span><br>
        PG Name: <span class="highlight">${pgName}</span><br>
        Address: ${pgAddress}<br>
        Booking Date: <span class="highlight">${bookingDate}</span><br>
        Status: <span class="success">✅ Approved</span>
    </div>
    
    <div class="text">
        📱 <strong>Next Steps:</strong><br>
        • Save this confirmation email<br>
        • Contact the PG owner if needed<br>
        • Check your dashboard for updates
    </div>
    
    <a href="http://localhost:3000/user/my-bookings" class="button">
        📊 View Booking Details
    </a>
    
    <div class="divider"></div>
    <div class="text" style="font-size: 14px; color: #6b7280;">
        Have a wonderful stay! Rate your experience after check-out.
    </div>
  `, '#059669'),

  bookingRejected: ({ name, pgName, reason, bookingId, pgAddress, bookingDate }) => createEmailTemplate(`
    <div class="title">❌ Booking Update</div>
    <div class="text">Dear <span class="highlight">${name}</span>,</div>
    <div class="text">
        We regret to inform you that your PG booking has been <span class="danger">declined</span>.
    </div>
    
    <div class="info-box">
        <strong>📋 Booking Details:</strong><br>
        Booking ID: <span class="highlight">#${bookingId}</span><br>
        PG Name: <span class="highlight">${pgName}</span><br>
        Address: ${pgAddress}<br>
        Booking Date: <span class="highlight">${bookingDate}</span><br>
        Status: <span class="danger">❌ Declined</span><br>
        Reason: ${reason || 'Not specified'}
    </div>
    
    <div class="text">
        Don't worry! There are many other PG options available on our platform.
    </div>
    
    <a href="http://localhost:3000/pg" class="button">
        🔍 Browse Other PGs
    </a>
  `, '#dc2626'),

  // Booking Completion Template
  bookingCompleted: ({ name, itemType, itemName, bookingId, completionDate }) => createEmailTemplate(`
    <div class="title">🎉 Booking Completed Successfully!</div>
    <div class="text">Dear <span class="highlight">${name}</span>,</div>
    <div class="text">
        Thank you for using our platform! Your ${itemType.toLowerCase()} booking has been marked as <span class="success">completed</span>.
    </div>
    
    <div class="info-box">
        <strong>📋 Completion Details:</strong><br>
        Booking ID: <span class="highlight">#${bookingId}</span><br>
        ${itemType}: <span class="highlight">${itemName}</span><br>
        Completion Date: <span class="highlight">${completionDate}</span><br>
        Status: <span class="success">✅ Completed</span>
    </div>
    
    <div class="text">
        🌟 <strong>Share Your Experience:</strong><br>
        • Rate your ${itemType.toLowerCase()} experience<br>
        • Write a review to help others<br>
        • Upload photos of your stay/ride
    </div>
    
    <div style="display: flex; gap: 10px; margin: 20px 0;">
        <a href="http://localhost:3000/user/my-bookings" class="button" style="flex: 1; text-align: center;">
            📊 View Booking
        </a>
        <a href="http://localhost:3000/user/write-review?booking=${bookingId}" class="button" style="flex: 1; text-align: center; background: #059669;">
            ⭐ Write Review
        </a>
    </div>
    
    <div class="divider"></div>
    <div class="text" style="font-size: 14px; color: #6b7280;">
        Thank you for choosing us! We hope you had a great experience. Book again anytime!
    </div>
  `, '#059669'),

  // Initial Booking Request Template (when user creates booking - pending approval)
  bookingRequested: ({ name, itemType, itemName, bookingId, itemAddress, startDate, endDate }) => createEmailTemplate(`
    <div class="title">📝 Booking Request Submitted!</div>
    <div class="text">Dear <span class="highlight">${name}</span>,</div>
    <div class="text">
        Thank you for your booking request! We've received your ${itemType.toLowerCase()} booking and it's currently under review.
    </div>
    
    <div class="info-box">
        <strong>📋 Request Details:</strong><br>
        Booking ID: <span class="highlight">#${bookingId}</span><br>
        ${itemType}: <span class="highlight">${itemName}</span><br>
        ${itemType === 'PG' ? `Address: ${itemAddress}<br>` : ''}
        ${startDate && endDate ? `Duration: <span class="highlight">${startDate} to ${endDate}</span><br>` : ''}
        Status: <span class="warning">⏳ Pending Approval</span>
    </div>
    
    <div class="text">
        ⏰ <strong>What Happens Next:</strong><br>
        • Owner will review your request<br>
        • You'll get an email notification with the decision<br>
        • Check your dashboard for real-time updates
    </div>
    
    <a href="http://localhost:3000/user/my-bookings" class="button">
        📊 Track Your Booking
    </a>
    
    <div class="divider"></div>
    <div class="text" style="font-size: 14px; color: #6b7280;">
        We'll notify you as soon as the owner responds to your request. Usually takes 2-24 hours.
    </div>
  `, '#f59e0b'),

  // Payment Receipt Templates
  paymentReceipt: ({ name, email, paymentId, amount, gst, totalAmount, itemType, itemName, bookingId, paymentDate, paymentMethod, transactionId }) => createEmailTemplate(`
    <div class="title">💳 Payment Receipt</div>
    <div class="text">Dear <span class="highlight">${name}</span>,</div>
    <div class="text">
        Thank you! Your payment has been <span class="success">successfully processed</span>.
    </div>
    
    <div class="info-box">
        <strong>💰 Payment Details:</strong><br>
        Receipt No: <span class="highlight">#${paymentId}</span><br>
        Transaction ID: <span class="highlight">${transactionId || 'N/A'}</span><br>
        Payment Date: <span class="highlight">${paymentDate}</span><br>
        Payment Method: <span class="highlight">${paymentMethod}</span><br>
        Status: <span class="success">✅ Paid</span>
    </div>

    <div class="info-box">
        <strong>📋 Booking Details:</strong><br>
        Booking ID: <span class="highlight">#${bookingId}</span><br>
        Service: <span class="highlight">${itemType} - ${itemName}</span><br>
        Customer: <span class="highlight">${email}</span>
    </div>

    <div class="info-box">
        <strong>💵 Amount Breakdown:</strong><br>
        Base Amount: <span class="highlight">₹${amount}</span><br>
        GST (18%): <span class="highlight">₹${gst}</span><br>
        <div style="border-top: 1px solid #e5e7eb; margin: 8px 0; padding-top: 8px;">
        <strong>Total Paid: <span class="highlight" style="font-size: 18px;">₹${totalAmount}</span></strong>
        </div>
    </div>
    
    <div class="text">
        📧 <strong>Important Notes:</strong><br>
        • Keep this receipt for your records<br>
        • Refunds will be processed to the same payment method<br>
        • Contact support for any payment queries
    </div>
    
    <div style="display: flex; gap: 10px; margin: 20px 0;">
        <a href="http://localhost:3000/user/my-bookings" class="button" style="flex: 1; text-align: center;">
            📊 View Booking
        </a>
        <a href="http://localhost:3000/user/payments" class="button" style="flex: 1; text-align: center; background: #059669;">
            💳 Payment History
        </a>
    </div>
    
    <div class="divider"></div>
    <div class="text" style="font-size: 14px; color: #6b7280;">
        This is an auto-generated receipt. For support, contact us at support@pgroomrental.com
    </div>
  `, '#3b82f6'),

  // Payment Failed Template
  paymentFailed: ({ name, paymentId, amount, itemType, itemName, bookingId, failureReason, retryUrl }) => createEmailTemplate(`
    <div class="title">❌ Payment Failed</div>
    <div class="text">Dear <span class="highlight">${name}</span>,</div>
    <div class="text">
        Unfortunately, your payment could not be processed at this time.
    </div>
    
    <div class="info-box">
        <strong>❌ Failed Payment Details:</strong><br>
        Payment ID: <span class="highlight">#${paymentId}</span><br>
        Amount: <span class="highlight">₹${amount}</span><br>
        Service: <span class="highlight">${itemType} - ${itemName}</span><br>
        Booking ID: <span class="highlight">#${bookingId}</span><br>
        Reason: <span class="danger">${failureReason || 'Payment gateway error'}</span><br>
        Status: <span class="danger">❌ Failed</span>
    </div>
    
    <div class="text">
        🔄 <strong>What You Can Do:</strong><br>
        • Try a different payment method<br>
        • Check your card/bank balance<br>
        • Contact your bank if needed<br>
        • Retry the payment
    </div>
    
    <div style="display: flex; gap: 10px; margin: 20px 0;">
        <a href="${retryUrl || 'http://localhost:3000/user/my-bookings'}" class="button" style="flex: 1; text-align: center;">
            🔄 Retry Payment
        </a>
        <a href="http://localhost:3000/contact" class="button" style="flex: 1; text-align: center; background: #dc2626;">
            🆘 Get Help
        </a>
    </div>
    
    <div class="divider"></div>
    <div class="text" style="font-size: 14px; color: #6b7280;">
        Your booking is still active. Please complete the payment to confirm your reservation.
    </div>
  `, '#dc2626'),

  // Refund Confirmation Template
  refundConfirmation: ({ name, refundId, originalPaymentId, refundAmount, itemType, itemName, bookingId, refundDate, refundReason, processingDays }) => createEmailTemplate(`
    <div class="title">💰 Refund Initiated</div>
    <div class="text">Dear <span class="highlight">${name}</span>,</div>
    <div class="text">
        Your refund request has been <span class="success">approved and initiated</span>.
    </div>
    
    <div class="info-box">
        <strong>💰 Refund Details:</strong><br>
        Refund ID: <span class="highlight">#${refundId}</span><br>
        Original Payment: <span class="highlight">#${originalPaymentId}</span><br>
        Refund Amount: <span class="highlight">₹${refundAmount}</span><br>
        Refund Date: <span class="highlight">${refundDate}</span><br>
        Reason: <span class="highlight">${refundReason}</span><br>
        Status: <span class="success">✅ Processing</span>
    </div>

    <div class="info-box">
        <strong>📋 Booking Details:</strong><br>
        Booking ID: <span class="highlight">#${bookingId}</span><br>
        Service: <span class="highlight">${itemType} - ${itemName}</span>
    </div>
    
    <div class="text">
        ⏰ <strong>Refund Processing:</strong><br>
        • Refund will be credited to your original payment method<br>
        • Processing time: <span class="highlight">${processingDays || '5-7'} business days</span><br>
        • You'll receive a confirmation once credited<br>
        • Track status in your payment history
    </div>
    
    <div style="display: flex; gap: 10px; margin: 20px 0;">
        <a href="http://localhost:3000/user/payments" class="button" style="flex: 1; text-align: center;">
            💳 Track Refund
        </a>
        <a href="http://localhost:3000/contact" class="button" style="flex: 1; text-align: center; background: #059669;">
            📞 Contact Support
        </a>
    </div>
    
    <div class="divider"></div>
    <div class="text" style="font-size: 14px; color: #6b7280;">
        Thank you for your patience. We appreciate your business and hope to serve you again.
    </div>
  `, '#059669'),

  // Marketing & Promotional Email Templates
  
  // Newsletter Template
  newsletter: ({ name, month, year, featuredPGs, featuredRooms, specialOffers, blogPosts, customerStories }) => createEmailTemplate(`
    <div class="title">📰 Monthly Newsletter - ${month} ${year}</div>
    <div class="text">Dear <span class="highlight">${name}</span>,</div>
    <div class="text">
        Welcome to our monthly newsletter! Here's what's new and exciting this month.
    </div>
    
    ${featuredPGs && featuredPGs.length > 0 ? `
    <div class="info-box">
        <strong>🏠 Featured PGs This Month:</strong><br>
        ${featuredPGs.map(pg => `
          • <span class="highlight">${pg.name}</span> - ${pg.location}<br>
          &nbsp;&nbsp;Starting from ₹${pg.price}/month<br>
        `).join('')}
    </div>
    ` : ''}
    
    ${featuredRooms && featuredRooms.length > 0 ? `
    <div class="info-box">
        <strong>� Popular Rooms:</strong><br>
        ${featuredRooms.map(room => `
          • <span class="highlight">${room.title}</span><br>
          &nbsp;&nbsp;₹${room.price}/month - ${room.location}<br>
        `).join('')}
    </div>
    ` : ''}
    
    ${specialOffers && specialOffers.length > 0 ? `
    <div class="text">
        🎉 <strong>Special Offers:</strong>
        ${specialOffers.map(offer => `
          <br>• ${offer.title} - <span class="success">${offer.discount}</span>
        `).join('')}
    </div>
    ` : ''}
    
    <div style="display: flex; gap: 10px; margin: 20px 0;">
        <a href="http://localhost:3000/pg-listings" class="button" style="flex: 1; text-align: center;">
            🏠 Browse PGs
        </a>
        <a href="http://localhost:3000/rooms" class="button" style="flex: 1; text-align: center; background: #059669;">
            � Rent Rooms
        </a>
    </div>
    
    <div class="divider"></div>
    <div class="text" style="font-size: 14px; color: #6b7280;">
        Don't want to receive newsletters? <a href="http://localhost:3000/unsubscribe?type=newsletter&email=${name}" style="color: #3b82f6;">Unsubscribe here</a>
    </div>
  `, '#3b82f6'),

  // Promotional Offer Template
  promotionalOffer: ({ name, offerTitle, discount, description, validTill, offerCode, terms, serviceType, originalPrice, discountedPrice, offerImage }) => createEmailTemplate(`
    <div class="title">🎉 Special Offer: ${offerTitle}</div>
    <div class="text">Dear <span class="highlight">${name}</span>,</div>
    <div class="text">
        Great news! We have an exclusive offer just for you!
    </div>
    
    <div style="background: linear-gradient(135deg, #059669, #047857); color: white; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
        <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">
            ${discount} OFF
        </div>
        <div style="font-size: 18px; margin-bottom: 10px;">
            ${offerTitle}
        </div>
        <div style="font-size: 14px; opacity: 0.9;">
            Valid till ${validTill}
        </div>
    </div>
    
    <div class="info-box">
        <strong>🎯 Offer Details:</strong><br>
        Service: <span class="highlight">${serviceType || 'PG & Room Rental'}</span><br>
        Discount: <span class="success">${discount}</span><br>
        ${originalPrice && discountedPrice ? `
          Original Price: <span style="text-decoration: line-through;">₹${originalPrice}</span><br>
          Your Price: <span class="highlight">₹${discountedPrice}</span><br>
        ` : ''}
        Valid Till: <span class="highlight">${validTill}</span><br>
        ${offerCode ? `Promo Code: <span class="highlight">${offerCode}</span><br>` : ''}
    </div>
    
    <div class="text">
        📝 <strong>How to Use:</strong><br>
        ${description || '• Book any service on our platform<br>• Apply the promo code at checkout<br>• Enjoy your discount!'}
    </div>
    
    ${terms ? `
    <div class="text" style="font-size: 14px; color: #6b7280;">
        <strong>Terms & Conditions:</strong><br>
        ${terms}
    </div>
    ` : ''}
    
    <div style="display: flex; gap: 10px; margin: 20px 0;">
        <a href="http://localhost:3000/offers" class="button" style="flex: 1; text-align: center;">
            🎉 Claim Offer
        </a>
        <a href="http://localhost:3000/pg-listings" class="button" style="flex: 1; text-align: center; background: #059669;">
            🏠 Book Now
        </a>
    </div>
    
    <div class="divider"></div>
    <div class="text" style="font-size: 14px; color: #6b7280;">
        Hurry! This offer expires on ${validTill}. <a href="http://localhost:3000/unsubscribe?type=promotional&email=${name}" style="color: #3b82f6;">Unsubscribe from promotional emails</a>
    </div>
  `, '#059669'),

  // Seasonal Campaign Template
  seasonalCampaign: ({ name, season, campaignTitle, mainOffer, subOffers, bgColor, seasonIcon, campaignEndDate }) => createEmailTemplate(`
    <div class="title">${seasonIcon} ${campaignTitle}</div>
    <div class="text">Dear <span class="highlight">${name}</span>,</div>
    <div class="text">
        ${season} is here! Time to make the most of this beautiful season with our special offers.
    </div>
    
    <div style="background: ${bgColor || 'linear-gradient(135deg, #f59e0b, #d97706)'}; color: white; padding: 25px; border-radius: 15px; text-align: center; margin: 25px 0;">
        <div style="font-size: 28px; margin-bottom: 15px;">
            ${seasonIcon}
        </div>
        <div style="font-size: 22px; font-weight: bold; margin-bottom: 10px;">
            ${mainOffer.title}
        </div>
        <div style="font-size: 18px; margin-bottom: 10px;">
            ${mainOffer.discount}
        </div>
        <div style="font-size: 14px; opacity: 0.9;">
            ${mainOffer.description}
        </div>
    </div>
    
    ${subOffers && subOffers.length > 0 ? `
    <div class="text">
        🎁 <strong>More ${season} Deals:</strong>
    </div>
    <div class="info-box">
        ${subOffers.map(offer => `
          <strong>${offer.service}:</strong> <span class="success">${offer.discount}</span><br>
          ${offer.description}<br><br>
        `).join('')}
    </div>
    ` : ''}
    
    <div class="text">
        ⏰ <strong>Limited Time Offer:</strong><br>
        • Valid for ${season} season only<br>
        • Book before ${campaignEndDate}<br>
        • Combine multiple offers for maximum savings<br>
        • Perfect weather for outdoor adventures!
    </div>
    
    <div style="display: flex; gap: 10px; margin: 20px 0;">
        <a href="http://localhost:3000/seasonal-offers" class="button" style="flex: 1; text-align: center;">
            ${seasonIcon} Explore Offers
        </a>
        <a href="http://localhost:3000/book-now" class="button" style="flex: 1; text-align: center; background: #dc2626;">
            🚀 Book Now
        </a>
    </div>
    
    <div class="divider"></div>
    <div class="text" style="font-size: 14px; color: #6b7280;">
        Make this ${season} memorable with us! Offer valid till ${campaignEndDate}.
    </div>
  `, bgColor || '#f59e0b'),

  // Customer Retention Email
  customerRetention: ({ name, lastBookingDate, loyaltyPoints, personalizedOffers, missedYouDiscount, favoriteServices }) => createEmailTemplate(`
    <div class="title">😊 We Miss You!</div>
    <div class="text">Dear <span class="highlight">${name}</span>,</div>
    <div class="text">
        We noticed it's been a while since your last booking (${lastBookingDate}). We miss having you as our valued customer!
    </div>
    
    <div class="info-box">
        <strong>🏆 Your Account Summary:</strong><br>
        Loyalty Points: <span class="highlight">${loyaltyPoints || 0} points</span><br>
        Last Booking: <span class="highlight">${lastBookingDate}</span><br>
        Favorite Services: <span class="highlight">${favoriteServices || 'PG & Room Rental'}</span><br>
        Status: <span class="success">Valued Customer</span>
    </div>
    
    <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
        <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">
            🎁 Welcome Back Offer
        </div>
        <div style="font-size: 18px; margin-bottom: 10px;">
            ${missedYouDiscount || '25% OFF'} on your next booking
        </div>
        <div style="font-size: 14px; opacity: 0.9;">
            Just for you - Limited time only!
        </div>
    </div>
    
    ${personalizedOffers && personalizedOffers.length > 0 ? `
    <div class="text">
        🎯 <strong>Personalized Offers Just for You:</strong>
    </div>
    <div class="info-box">
        ${personalizedOffers.map(offer => `
          • <span class="highlight">${offer.title}</span> - ${offer.discount}<br>
          &nbsp;&nbsp;${offer.description}<br><br>
        `).join('')}
    </div>
    ` : ''}
    
    <div class="text">
        🌟 <strong>What's New Since You Left:</strong><br>
        • New PG properties in prime locations<br>
        • Latest room options available<br>
        • Improved booking experience<br>
        • 24/7 customer support
    </div>
    
    <div style="display: flex; gap: 10px; margin: 20px 0;">
        <a href="http://localhost:3000/welcome-back" class="button" style="flex: 1; text-align: center;">
            🎁 Claim Offer
        </a>
        <a href="http://localhost:3000/whats-new" class="button" style="flex: 1; text-align: center; background: #059669;">
            ✨ See What's New
        </a>
    </div>
    
    <div class="divider"></div>
    <div class="text" style="font-size: 14px; color: #6b7280;">
        We value your relationship with us. If you prefer not to receive these emails, <a href="http://localhost:3000/unsubscribe?type=retention&email=${name}" style="color: #3b82f6;">click here</a>.
    </div>
  `, '#dc2626'),

  // Owner Notifications
  ownerApproval: ({ name, pgName, approvalDate }) => createEmailTemplate(`
    <div class="title">🎉 Owner Account Approved!</div>
    <div class="text">Dear <span class="highlight">${name}</span>,</div>
    <div class="text">
        Congratulations! Your owner account for <strong>${pgName}</strong> has been approved.
    </div>
    
    <div class="info-box">
        <strong>🏢 Business Details:</strong><br>
        Business Name: <span class="highlight">${pgName}</span><br>
        Approval Date: <span class="highlight">${approvalDate}</span><br>
        Status: <span class="success">✅ Approved</span>
    </div>
    
    <div class="text">
        🚀 <strong>Ready to Start Earning:</strong><br>
        • List your PG properties<br>
        • Add room rentals<br>
        • Manage bookings & payments
    </div>
    
    <a href="http://localhost:3000/owner/dashboard" class="button">
        🏢 Access Owner Dashboard
    </a>
  `, '#059669'),

  // System Notifications
  passwordChanged: ({ name, email, role, lastPasswordUpdate }) => createEmailTemplate(`
    <div class="title">🔐 Password Changed Successfully</div>
    <div class="text">Dear <span class="highlight">${name}</span>,</div>
    <div class="text">
        Your account password has been successfully changed.
    </div>
    
    <div class="info-box">
        <strong>🔒 Security Details:</strong><br>
        Account: <span class="highlight">${email}</span><br>
        Role: <span class="highlight">${role}</span><br>
        Changed: <span class="highlight">${lastPasswordUpdate}</span><br>
        Status: <span class="success">✅ Secure</span>
    </div>
    
    <div class="text">
        <strong>⚠️ Security Alert:</strong> If you didn't make this change, please contact support immediately.
    </div>
    
    <a href="http://localhost:3000/contact" class="button">
        🆘 Contact Support
    </a>
  `, '#dc2626'),

  // Enhanced Password Reset Confirmation Template
  passwordResetConfirmation: ({ name, email, role, resetTime, ipAddress, userAgent }) => createEmailTemplate(`
    <div class="title">🔐 Password Reset Successful</div>
    <div class="text">Dear <span class="highlight">${name}</span>,</div>
    <div class="text">
        Your password has been successfully reset using the forgot password feature.
    </div>
    
    <div class="info-box">
        <strong>🛡️ Reset Details:</strong><br>
        Account: <span class="highlight">${email}</span><br>
        Role: <span class="highlight">${role.charAt(0).toUpperCase() + role.slice(1)}</span><br>
        Reset Time: <span class="highlight">${resetTime}</span><br>
        IP Address: <span class="warning">${ipAddress || 'Unknown'}</span><br>
        Device: <span class="info">${userAgent ? userAgent.substring(0, 50) + '...' : 'Unknown'}</span><br>
        Status: <span class="success">✅ Password Updated</span>
    </div>
    
    <div class="text">
        <strong>🔒 Security Recommendations:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Use a strong, unique password</li>
            <li>Enable two-factor authentication if available</li>
            <li>Don't share your password with others</li>
            <li>Log out from shared devices</li>
        </ul>
    </div>
    
    <div class="text">
        <strong>⚠️ Security Alert:</strong> If you didn't reset your password, please contact our support team immediately and secure your account.
    </div>
    
    <div style="display: flex; gap: 10px; margin: 20px 0;">
        <a href="${role === 'admin' ? 'http://localhost:3000/admin/login' : role === 'owner' ? 'http://localhost:3000/owner/login' : 'http://localhost:3000/user/login'}" class="button" style="flex: 1; text-align: center;">
            🔑 Login Now
        </a>
        <a href="http://localhost:3000/contact" class="button" style="flex: 1; text-align: center; background: #dc2626;">
            🆘 Report Issue
        </a>
    </div>
    
    <div class="divider"></div>
    
    <div class="text" style="font-size: 14px; color: #6b7280;">
        <strong>Next Steps:</strong><br>
        1. Login with your new password<br>
        2. Update your security settings<br>
        3. Review your account activity<br>
        4. Consider enabling additional security features
    </div>
  `, '#059669'),

  // Generic Notification Template
  notification: ({ name, title, message, actionText, actionUrl, type = 'info' }) => {
    const colors = {
      success: '#059669',
      error: '#dc2626', 
      warning: '#d97706',
      info: '#3b82f6'
    };
    
    return createEmailTemplate(`
      <div class="title">${title}</div>
      <div class="text">Dear <span class="highlight">${name}</span>,</div>
      <div class="text">${message}</div>
      
      ${actionText && actionUrl ? `
        <a href="${actionUrl}" class="button">
          ${actionText}
        </a>
      ` : ''}
    `, colors[type]);
  },

  // Profile Update Confirmation Template
  profileUpdateConfirmation: ({ name, email, role, updatedFields, updateTime, ipAddress, userAgent }) => createEmailTemplate(`
    <div class="title">✅ Profile Updated Successfully</div>
    <div class="text">Dear <span class="highlight">${name}</span>,</div>
    <div class="text">
        Your profile has been successfully updated. Here are the details of the changes:
    </div>
    
    <div class="info-box">
        <strong>📝 Update Details:</strong><br>
        Account: <span class="highlight">${email}</span><br>
        Role: <span class="highlight">${role.charAt(0).toUpperCase() + role.slice(1)}</span><br>
        Updated Fields: <span class="highlight">${updatedFields.join(', ')}</span><br>
        Update Time: <span class="highlight">${updateTime}</span><br>
        IP Address: <span class="warning">${ipAddress || 'Unknown'}</span><br>
        Device: <span class="info">${userAgent ? userAgent.substring(0, 50) + '...' : 'Unknown'}</span><br>
        Status: <span class="success">✅ Profile Updated</span>
    </div>
    
    <div class="text">
        <strong>🔒 Security Information:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
            <li>All profile changes are logged for security</li>
            <li>If you didn't make these changes, please contact support immediately</li>
            <li>Review your account settings regularly</li>
            <li>Keep your login credentials secure</li>
        </ul>
    </div>
    
    <div style="display: flex; gap: 10px; margin: 20px 0;">
        <a href="${role === 'admin' ? 'http://localhost:3000/admin/profile' : role === 'owner' ? 'http://localhost:3000/owner/profile' : 'http://localhost:3000/user/profile'}" class="button" style="flex: 1; text-align: center;">
            👤 View Profile
        </a>
        <a href="http://localhost:3000/contact" class="button" style="flex: 1; text-align: center; background: #dc2626;">
            🆘 Report Issue
        </a>
    </div>
    
    <div class="divider"></div>
    
    <div class="text" style="font-size: 14px; color: #6b7280;">
        <strong>⚠️ Security Alert:</strong> If you didn't make these changes, please secure your account immediately and contact our support team.
    </div>
  `, '#3b82f6')
};

export default emailTemplates;
