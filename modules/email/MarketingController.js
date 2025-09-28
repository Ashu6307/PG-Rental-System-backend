// Marketing Email Controller - Organized into EmailService
import EmailService from './EmailService.js';
import User from '../../models/User.js';
import EmailCampaign from '../../models/EmailCampaign.js';

class MarketingController {
  // Newsletter signup
  async subscribeNewsletter(req, res) {
    try {
      const { email, name } = req.body;
      
      // Check if user exists
      let user = await User.findOne({ email });
      if (user) {
        user.emailPreferences.newsletter = true;
        await user.save();
      } else {
        // Create new subscriber
        user = new User({
          email,
          name,
          role: 'user',
          emailVerified: false,
          emailPreferences: { newsletter: true, promotional: true }
        });
        await user.save();
      }

      // Send welcome newsletter email
      await EmailService.sendEmailWithLogging({
        to: email,
        subject: '📧 Welcome to Our Newsletter!',
        emailType: 'newsletter_welcome',
        templateName: 'newsletterSignup',
        templateData: { name, email },
        userId: user._id
      });

      res.json({ 
        success: true, 
        message: 'Successfully subscribed to newsletter!' 
      });

    } catch (error) {
      res.status(500).json({ 
        error: 'Subscription failed', 
        details: error.message 
      });
    }
  }

  // Send Newsletter
  async sendNewsletter(req, res) {
    try {
      const { subject, content, targetLocation } = req.body;
      
      const users = await EmailService.getTargetedUsers('newsletter', targetLocation);
      
      if (users.length === 0) {
        return res.status(400).json({ 
          error: 'No eligible users found for newsletter' 
        });
      }

      const result = await EmailService.sendBulkEmails({
        users,
        subject,
        emailType: 'newsletter',
        templateName: 'newsletter',
        templateData: content,
        campaignName: `Newsletter - ${subject}`,
        sentBy: req.user._id
      });

      res.json({
        success: true,
        message: 'Newsletter sent successfully!',
        ...result
      });

    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to send newsletter', 
        details: error.message 
      });
    }
  }

  // Send Promotional Offers
  async sendPromotionalOffer(req, res) {
    try {
      const { subject, offerDetails, targetAudience, targetLocation } = req.body;
      
      const users = await EmailService.getTargetedUsers(targetAudience, targetLocation);
      
      const result = await EmailService.sendBulkEmails({
        users,
        subject,
        emailType: 'promotional',
        templateName: 'promotional',
        templateData: offerDetails,
        campaignName: `Promotion - ${offerDetails.title}`,
        sentBy: req.user._id
      });

      res.json({
        success: true,
        message: 'Promotional offer sent successfully!',
        ...result
      });

    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to send promotional offer', 
        details: error.message 
      });
    }
  }

  // Send Seasonal Campaigns
  async sendSeasonalCampaign(req, res) {
    try {
      const { campaignType, customMessage, targetLocation } = req.body;
      
      const seasonalData = {
        'summer': {
          subject: '☀️ Summer Special - Beat the Heat with Our Cool Rides!',
          title: 'Summer Special Offers',
          message: customMessage || 'Beat the summer heat with our air-conditioned PGs, rooms, and flats!',
          discount: '25% OFF',
          validUntil: 'End of Summer Season'
        },
        'monsoon': {
          subject: '🌧️ Monsoon Ready - Safe & Dry Options Available!',
          title: 'Monsoon Special',
          message: customMessage || 'Stay safe and dry this monsoon with our covered parking and weatherproof accommodations!',
          discount: '20% OFF',
          validUntil: 'Monsoon Season'
        },
        'winter': {
          subject: '❄️ Winter Warmth - Cozy Stays & Heated Rooms!',
          title: 'Winter Comfort Package',
          message: customMessage || 'Stay warm this winter with our heated PGs, rooms, and cozy flats!',
          discount: '30% OFF',
          validUntil: 'Winter Season'
        },
        'festival': {
          subject: '🎉 Festival Special - Celebrate with Great Deals!',
          title: 'Festival Bonanza',
          message: customMessage || 'Celebrate the festive season with amazing deals on PG stays and room rentals!',
          discount: '35% OFF',
          validUntil: 'Festival Period'
        }
      };

      const campaignDetails = seasonalData[campaignType];
      if (!campaignDetails) {
        return res.status(400).json({ error: 'Invalid campaign type' });
      }

      const users = await EmailService.getTargetedUsers('newsletter', targetLocation);
      
      const result = await EmailService.sendBulkEmails({
        users,
        subject: campaignDetails.subject,
        emailType: 'seasonal_campaign',
        templateName: 'seasonalCampaign',
        templateData: campaignDetails,
        campaignName: `${campaignType.charAt(0).toUpperCase() + campaignType.slice(1)} Campaign`,
        sentBy: req.user._id
      });

      res.json({
        success: true,
        message: 'Seasonal campaign sent successfully!',
        campaignType,
        ...result
      });

    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to send seasonal campaign', 
        details: error.message 
      });
    }
  }

  // Send Retention Emails
  async sendRetentionEmail(req, res) {
    try {
      const { customMessage, targetLocation } = req.body;
      
      const users = await EmailService.getTargetedUsers('inactive', targetLocation);
      
      if (users.length === 0) {
        return res.status(400).json({ 
          error: 'No inactive users found for retention campaign' 
        });
      }

      const result = await EmailService.sendBulkEmails({
        users,
        subject: '💔 We Miss You! Special Welcome Back Offer Inside',
        emailType: 'retention',
        templateName: 'retention',
        templateData: {
          message: customMessage || "We've noticed you haven't booked with us recently. Come back and enjoy exclusive offers!",
          discount: '40% OFF',
          offerTitle: 'Welcome Back Special',
          validUntil: '30 days from now'
        },
        campaignName: 'User Retention Campaign',
        sentBy: req.user._id
      });

      res.json({
        success: true,
        message: 'Retention emails sent successfully!',
        ...result
      });

    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to send retention emails', 
        details: error.message 
      });
    }
  }

  // Get Campaign Performance
  async getCampaignPerformance(req, res) {
    try {
      const campaigns = await EmailCampaign.find()
        .sort({ createdAt: -1 })
        .limit(10);

      const performance = campaigns.map(campaign => ({
        id: campaign._id,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        totalRecipients: campaign.stats.totalRecipients,
        emailsSent: campaign.stats.emailsSent,
        emailsFailed: campaign.stats.emailsFailed,
        successRate: campaign.stats.totalRecipients > 0 
          ? ((campaign.stats.emailsSent / campaign.stats.totalRecipients) * 100).toFixed(2)
          : 0,
        sentAt: campaign.sentAt,
        createdBy: campaign.createdBy
      }));

      res.json({
        success: true,
        campaigns: performance
      });

    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to get campaign performance', 
        details: error.message 
      });
    }
  }
}

export default new MarketingController();
