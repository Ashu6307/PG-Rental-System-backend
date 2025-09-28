import Inquiry from '../models/Inquiry.js';
import Admin from '../models/Admin.js';
import PG from '../models/PG.js';
import Flat from '../models/Flat.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/sendEmail.js';

// **USER INQUIRY SYSTEM - Admin Mediated Communication**

// 1. Submit New Inquiry (Public Route)
export const submitInquiry = async (req, res) => {
  try {
    const {
      propertyId,
      propertyType,
      inquiryType,
      message,
      preferences,
      userContact
    } = req.body;
    
    // Validate required fields
    if (!propertyId || !propertyType || !inquiryType || !message || !userContact) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Get property details
    let property;
    let owner;
    
    if (propertyType === 'PG') {
      property = await PG.findById(propertyId).populate('owner');
    } else if (propertyType === 'Flat') {
      property = await Flat.findById(propertyId).populate('owner');
    }
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    owner = property.owner;
    
    // Find admin for the city
    const cityAdmin = await Admin.findOne({
      'assignedCities.city': property.city,
      'assignedCities.isActive': true,
      isActive: true
    });
    
    if (!cityAdmin) {
      return res.status(404).json({
        success: false,
        message: 'No admin available for this city. Please try again later.'
      });
    }
    
    // Get or create user
    let user = await User.findOne({ email: userContact.email });
    if (!user) {
      user = new User({
        name: userContact.name,
        email: userContact.email,
        phone: userContact.phone,
        role: 'user',
        status: 'active'
      });
      await user.save();
    }
    
    // Create inquiry
    const inquiry = new Inquiry({
      user: user._id,
      userContact,
      property: {
        propertyId,
        propertyType,
        propertyName: property.name,
        city: property.city,
        area: property.address
      },
      owner: owner._id,
      assignedAdmin: cityAdmin._id,
      inquiryType,
      message,
      preferences: preferences || {},
      status: 'pending',
      priority: 'medium',
      source: 'web',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    await inquiry.save();
    
    // Add initial admin action
    inquiry.adminActions.push({
      action: 'inquiry_received',
      actionBy: cityAdmin._id,
      notes: 'New inquiry received and assigned to admin'
    });
    
    await inquiry.save();
    
    // Send notification email to admin
    try {
      await sendEmail({
        to: cityAdmin.email,
        subject: `New Property Inquiry - ${property.name}`,
        html: `
          <h3>New Property Inquiry Received</h3>
          <p><strong>Inquiry ID:</strong> ${inquiry.inquiryId}</p>
          <p><strong>Property:</strong> ${property.name}</p>
          <p><strong>City:</strong> ${property.city}</p>
          <p><strong>User:</strong> ${userContact.name} (${userContact.email})</p>
          <p><strong>Message:</strong> ${message}</p>
          <p><strong>Type:</strong> ${inquiryType}</p>
          <br>
          <p>Please login to admin dashboard to respond to this inquiry.</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
    }
    
    res.json({
      success: true,
      message: 'Inquiry submitted successfully! Admin will contact you soon.',
      data: {
        inquiryId: inquiry.inquiryId,
        status: inquiry.status,
        estimatedResponse: '24 hours'
      }
    });
    
  } catch (error) {
    console.error('Submit inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit inquiry',
      error: error.message
    });
  }
};

// 2. Get Inquiries for Admin (City-wise)
export const getAdminInquiries = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { 
      city, 
      status, 
      priority, 
      page = 1, 
      limit = 20,
      inquiryType 
    } = req.query;
    
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    // Build query
    let query = { assignedAdmin: adminId };
    
    // City filter
    if (city) {
      if (admin.role !== 'super_admin') {
        const assignedCities = admin.assignedCities
          .filter(c => c.isActive)
          .map(c => c.city);
        
        if (!assignedCities.includes(city)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied for this city'
          });
        }
      }
      query['property.city'] = city;
    } else if (admin.role !== 'super_admin') {
      // For city admins, only show their assigned cities
      const assignedCities = admin.assignedCities
        .filter(c => c.isActive)
        .map(c => c.city);
      
      query['property.city'] = { $in: assignedCities };
    }
    
    // Other filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (inquiryType) query.inquiryType = inquiryType;
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Get inquiries
    const inquiries = await Inquiry.find(query)
      .populate('user', 'name email phone')
      .populate('owner', 'name email phone')
      .sort({ priority: -1, inquiryDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalInquiries = await Inquiry.countDocuments(query);
    
    // Get summary stats
    const summaryStats = await Inquiry.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        inquiries,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalInquiries / limit),
          totalInquiries,
          limit: parseInt(limit)
        },
        summary: summaryStats
      }
    });
    
  } catch (error) {
    console.error('Get admin inquiries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inquiries',
      error: error.message
    });
  }
};

// 3. Respond to Inquiry
export const respondToInquiry = async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const { responseMessage, attachments = [], followUpRequired = false } = req.body;
    const adminId = req.user.id;
    
    const inquiry = await Inquiry.findById(inquiryId)
      .populate('user', 'name email')
      .populate('owner', 'name email phone');
    
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }
    
    // Check admin access
    if (inquiry.assignedAdmin.toString() !== adminId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied for this inquiry'
      });
    }
    
    // Update inquiry with response
    inquiry.adminResponse = {
      hasResponse: true,
      responseMessage,
      responseDate: new Date(),
      attachments,
      followUpRequired
    };
    
    inquiry.status = 'response_sent';
    
    // Add admin action
    inquiry.adminActions.push({
      action: 'response_prepared',
      actionBy: adminId,
      notes: 'Response sent to user',
      attachments
    });
    
    // Add communication record
    inquiry.communications.push({
      from: 'admin',
      to: 'user',
      message: responseMessage,
      messageType: 'email'
    });
    
    await inquiry.save();
    
    // Send response email to user
    try {
      await sendEmail({
        to: inquiry.user.email,
        subject: `Response to Your Property Inquiry - ${inquiry.inquiryId}`,
        html: `
          <h3>Response to Your Property Inquiry</h3>
          <p>Dear ${inquiry.user.name},</p>
          <p>We have received your inquiry about <strong>${inquiry.property.propertyName}</strong> in ${inquiry.property.city}.</p>
          <br>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
            <h4>Admin Response:</h4>
            <p>${responseMessage}</p>
          </div>
          <br>
          <p><strong>Inquiry ID:</strong> ${inquiry.inquiryId}</p>
          <p><strong>Response Date:</strong> ${new Date().toLocaleString()}</p>
          <br>
          <p>If you have any further questions, please reply to this email or contact us.</p>
          <p>Best regards,<br>Property Rental Platform Team</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send response email:', emailError);
    }
    
    res.json({
      success: true,
      message: 'Response sent successfully',
      data: {
        inquiryId: inquiry.inquiryId,
        responseDate: inquiry.adminResponse.responseDate,
        status: inquiry.status
      }
    });
    
  } catch (error) {
    console.error('Respond to inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send response',
      error: error.message
    });
  }
};

// 4. Schedule Visit
export const scheduleVisit = async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const { 
      visitDate, 
      visitTime, 
      visitType = 'physical', 
      instructions = '',
      meetingLink = '' 
    } = req.body;
    const adminId = req.user.id;
    
    const inquiry = await Inquiry.findById(inquiryId)
      .populate('user', 'name email phone')
      .populate('owner', 'name email phone');
    
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }
    
    // Check admin access
    if (inquiry.assignedAdmin.toString() !== adminId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied for this inquiry'
      });
    }
    
    // Update visit details
    inquiry.visitDetails = {
      isScheduled: true,
      scheduledDate: new Date(visitDate),
      scheduledTime: visitTime,
      visitType,
      meetingLink: visitType === 'virtual' ? meetingLink : '',
      instructions,
      confirmationStatus: 'pending'
    };
    
    inquiry.status = 'visit_scheduled';
    
    // Add admin action
    inquiry.adminActions.push({
      action: 'visit_scheduled',
      actionBy: adminId,
      notes: `${visitType} visit scheduled for ${visitDate} at ${visitTime}`
    });
    
    await inquiry.save();
    
    // Send visit confirmation emails
    const visitDetails = `
      <h3>Property Visit Scheduled</h3>
      <p><strong>Property:</strong> ${inquiry.property.propertyName}</p>
      <p><strong>Date:</strong> ${new Date(visitDate).toDateString()}</p>
      <p><strong>Time:</strong> ${visitTime}</p>
      <p><strong>Type:</strong> ${visitType}</p>
      ${visitType === 'virtual' && meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : ''}
      ${instructions ? `<p><strong>Instructions:</strong> ${instructions}</p>` : ''}
    `;
    
    // Email to user
    try {
      await sendEmail({
        to: inquiry.user.email,
        subject: `Property Visit Scheduled - ${inquiry.property.propertyName}`,
        html: `
          <p>Dear ${inquiry.user.name},</p>
          ${visitDetails}
          <p>Please confirm your availability by replying to this email.</p>
          <p>Best regards,<br>Property Rental Platform Team</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send user visit email:', emailError);
    }
    
    // Email to owner
    try {
      await sendEmail({
        to: inquiry.owner.email,
        subject: `Property Visit Scheduled - ${inquiry.property.propertyName}`,
        html: `
          <p>Dear ${inquiry.owner.name},</p>
          ${visitDetails}
          <p><strong>Visitor:</strong> ${inquiry.user.name} (${inquiry.user.phone})</p>
          <p>Please be available for the scheduled visit.</p>
          <p>Best regards,<br>Property Rental Platform Team</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send owner visit email:', emailError);
    }
    
    res.json({
      success: true,
      message: 'Visit scheduled successfully',
      data: {
        inquiryId: inquiry.inquiryId,
        visitDetails: inquiry.visitDetails
      }
    });
    
  } catch (error) {
    console.error('Schedule visit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule visit',
      error: error.message
    });
  }
};

// 5. Update Inquiry Status
export const updateInquiryStatus = async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const { status, notes = '' } = req.body;
    const adminId = req.user.id;
    
    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }
    
    // Check admin access
    if (inquiry.assignedAdmin.toString() !== adminId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied for this inquiry'
      });
    }
    
    // Update status
    const oldStatus = inquiry.status;
    inquiry.status = status;
    
    // Add admin action
    inquiry.adminActions.push({
      action: `status_changed_from_${oldStatus}_to_${status}`,
      actionBy: adminId,
      notes
    });
    
    await inquiry.save();
    
    res.json({
      success: true,
      message: 'Inquiry status updated successfully',
      data: {
        inquiryId: inquiry.inquiryId,
        oldStatus,
        newStatus: status
      }
    });
    
  } catch (error) {
    console.error('Update inquiry status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inquiry status',
      error: error.message
    });
  }
};

// 6. Get Inquiry Details
export const getInquiryDetails = async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const adminId = req.user.id;
    
    const inquiry = await Inquiry.findById(inquiryId)
      .populate('user', 'name email phone profilePhoto')
      .populate('owner', 'name email phone')
      .populate('assignedAdmin', 'name email')
      .populate('adminActions.actionBy', 'name email');
    
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }
    
    // Check admin access
    if (inquiry.assignedAdmin._id.toString() !== adminId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied for this inquiry'
      });
    }
    
    res.json({
      success: true,
      data: inquiry
    });
    
  } catch (error) {
    console.error('Get inquiry details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inquiry details',
      error: error.message
    });
  }
};
