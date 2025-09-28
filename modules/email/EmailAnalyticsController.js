// Email Analytics Controller - Organized into Email Module
import EmailLog from '../../models/EmailLog.js';
import EmailCampaign from '../../models/EmailCampaign.js';
import User from '../../models/User.js';

class EmailAnalyticsController {
  // Dashboard Overview
  async getDashboard(req, res) {
    try {
      const { timeframe = '30' } = req.query;
      const days = parseInt(timeframe);
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Total emails sent
      const totalEmails = await EmailLog.countDocuments({
        sentAt: { $gte: startDate }
      });

      // Success rate
      const successfulEmails = await EmailLog.countDocuments({
        sentAt: { $gte: startDate },
        status: 'sent'
      });

      const successRate = totalEmails > 0 ? 
        ((successfulEmails / totalEmails) * 100).toFixed(2) : 0;

      // Email types distribution
      const emailTypeStats = await EmailLog.aggregate([
        { $match: { sentAt: { $gte: startDate } } },
        { $group: { _id: '$emailType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Daily email volume
      const dailyVolume = await EmailLog.aggregate([
        { $match: { sentAt: { $gte: startDate } } },
        {
          $group: {
            _id: { 
              $dateToString: { 
                format: '%Y-%m-%d', 
                date: '$sentAt' 
              } 
            },
            sent: { 
              $sum: { 
                $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] 
              } 
            },
            failed: { 
              $sum: { 
                $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] 
              } 
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Recent campaigns
      const recentCampaigns = await EmailCampaign.find({
        createdAt: { $gte: startDate }
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name type status stats sentAt');

      // Top failure reasons
      const failureReasons = await EmailLog.aggregate([
        { 
          $match: { 
            sentAt: { $gte: startDate },
            status: 'failed',
            errorMessage: { $exists: true }
          } 
        },
        { $group: { _id: '$errorMessage', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);

      res.json({
        success: true,
        dashboard: {
          overview: {
            totalEmails,
            successfulEmails,
            failedEmails: totalEmails - successfulEmails,
            successRate: parseFloat(successRate)
          },
          emailTypes: emailTypeStats,
          dailyVolume,
          recentCampaigns,
          failureReasons,
          timeframe: `${days} days`
        }
      });

    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to get dashboard data', 
        details: error.message 
      });
    }
  }

  // Email Logs with filtering
  async getEmailLogs(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        emailType, 
        status, 
        startDate, 
        endDate,
        recipient 
      } = req.query;

      const skip = (page - 1) * limit;
      
      // Build filter
      let filter = {};
      
      if (emailType) filter.emailType = emailType;
      if (status) filter.status = status;
      if (recipient) filter.recipient = new RegExp(recipient, 'i');
      
      if (startDate || endDate) {
        filter.sentAt = {};
        if (startDate) filter.sentAt.$gte = new Date(startDate);
        if (endDate) filter.sentAt.$lte = new Date(endDate);
      }

      // Get logs with pagination
      const logs = await EmailLog.find(filter)
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'name email role');

      const totalLogs = await EmailLog.countDocuments(filter);
      const totalPages = Math.ceil(totalLogs / limit);

      res.json({
        success: true,
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalLogs,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });

    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to get email logs', 
        details: error.message 
      });
    }
  }

  // Campaign Analytics
  async getCampaignAnalytics(req, res) {
    try {
      const { page = 1, limit = 10, type, status } = req.query;
      const skip = (page - 1) * limit;

      // Build filter
      let filter = {};
      if (type) filter.type = type;
      if (status) filter.status = status;

      // Get campaigns with analytics
      const campaigns = await EmailCampaign.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name email');

      const totalCampaigns = await EmailCampaign.countDocuments(filter);

      // Calculate enhanced analytics for each campaign
      const campaignsWithAnalytics = await Promise.all(
        campaigns.map(async (campaign) => {
          // Get detailed email logs for this campaign
          const emailLogs = await EmailLog.find({ 
            campaignId: campaign._id.toString() 
          });

          const analytics = {
            totalSent: emailLogs.filter(log => log.status === 'sent').length,
            totalFailed: emailLogs.filter(log => log.status === 'failed').length,
            successRate: emailLogs.length > 0 
              ? ((emailLogs.filter(log => log.status === 'sent').length / emailLogs.length) * 100).toFixed(2)
              : 0,
            failureReasons: {}
          };

          // Group failure reasons
          emailLogs
            .filter(log => log.status === 'failed' && log.errorMessage)
            .forEach(log => {
              analytics.failureReasons[log.errorMessage] = 
                (analytics.failureReasons[log.errorMessage] || 0) + 1;
            });

          return {
            ...campaign.toObject(),
            analytics
          };
        })
      );

      res.json({
        success: true,
        campaigns: campaignsWithAnalytics,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCampaigns / limit),
          totalCampaigns,
          hasNextPage: page * limit < totalCampaigns,
          hasPrevPage: page > 1
        }
      });

    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to get campaign analytics', 
        details: error.message 
      });
    }
  }

  // Email Performance Stats
  async getEmailStats(req, res) {
    try {
      const { period = 'week' } = req.query;
      
      let groupFormat, startDate;
      
      switch (period) {
        case 'day':
          groupFormat = '%Y-%m-%d-%H';
          startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          groupFormat = '%Y-%m-%d';
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          groupFormat = '%Y-%m-%d';
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          groupFormat = '%Y-%m';
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          groupFormat = '%Y-%m-%d';
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      }

      // Email volume over time
      const volumeStats = await EmailLog.aggregate([
        { $match: { sentAt: { $gte: startDate } } },
        {
          $group: {
            _id: { 
              $dateToString: { 
                format: groupFormat, 
                date: '$sentAt' 
              } 
            },
            totalEmails: { $sum: 1 },
            sentEmails: { 
              $sum: { 
                $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] 
              } 
            },
            failedEmails: { 
              $sum: { 
                $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] 
              } 
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Email type performance
      const typeStats = await EmailLog.aggregate([
        { $match: { sentAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$emailType',
            total: { $sum: 1 },
            sent: { 
              $sum: { 
                $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] 
              } 
            },
            failed: { 
              $sum: { 
                $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] 
              } 
            }
          }
        },
        {
          $project: {
            emailType: '$_id',
            total: 1,
            sent: 1,
            failed: 1,
            successRate: { 
              $round: [
                { 
                  $multiply: [
                    { $divide: ['$sent', '$total'] }, 
                    100
                  ] 
                }, 
                2
              ] 
            }
          }
        },
        { $sort: { total: -1 } }
      ]);

      res.json({
        success: true,
        stats: {
          period,
          volumeOverTime: volumeStats,
          emailTypePerformance: typeStats
        }
      });

    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to get email statistics', 
        details: error.message 
      });
    }
  }

  // User Email Preferences Analytics
  async getUserPreferencesStats(req, res) {
    try {
      // Email preference distribution
      const preferencesStats = await User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            newsletterSubscribers: { 
              $sum: { 
                $cond: [
                  { $ne: ['$emailPreferences.newsletter', false] }, 
                  1, 
                  0
                ] 
              } 
            },
            promotionalSubscribers: { 
              $sum: { 
                $cond: [
                  { $ne: ['$emailPreferences.promotional', false] }, 
                  1, 
                  0
                ] 
              } 
            },
            verifiedEmails: { 
              $sum: { 
                $cond: ['$emailVerified', 1, 0] 
              } 
            }
          }
        }
      ]);

      // Role-wise email preferences
      const roleStats = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
            newsletterSubscribers: { 
              $sum: { 
                $cond: [
                  { $ne: ['$emailPreferences.newsletter', false] }, 
                  1, 
                  0
                ] 
              } 
            },
            promotionalSubscribers: { 
              $sum: { 
                $cond: [
                  { $ne: ['$emailPreferences.promotional', false] }, 
                  1, 
                  0
                ] 
              } 
            }
          }
        }
      ]);

      res.json({
        success: true,
        userPreferences: {
          overall: preferencesStats[0] || {},
          byRole: roleStats
        }
      });

    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to get user preferences stats', 
        details: error.message 
      });
    }
  }
}

export default new EmailAnalyticsController();
