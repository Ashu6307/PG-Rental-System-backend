// Email Queue Management System (Simplified - No Redis Dependency)
// This is a simplified queue system that works without Redis/Bull
import EmailService from './EmailService.js';
import { EMAIL_CONFIG } from './EmailConfig.js';

// Simple in-memory queue implementation
class SimpleEmailQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.stats = {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0
    };
  }

  // Add job to queue
  async add(jobType, data, options = {}) {
    const job = {
      id: Date.now() + Math.random(),
      type: jobType,
      data,
      options,
      createdAt: new Date(),
      status: 'waiting'
    };
    
    this.queue.push(job);
    this.stats.waiting++;
    
    // Process immediately if not already processing
    if (!this.processing) {
      this.processQueue();
    }
    
    return job;
  }

  // Process queue
  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const job = this.queue.shift();
      this.stats.waiting--;
      this.stats.active++;
      
      try {
        await this.processJob(job);
        this.stats.completed++;
        console.log(`Email job ${job.id} completed successfully`);
      } catch (error) {
        this.stats.failed++;
        console.error(`Email job ${job.id} failed:`, error.message);
      }
      
      this.stats.active--;
    }
    
    this.processing = false;
  }

  // Process individual job
  async processJob(job) {
    switch (job.type) {
      case 'send-single-email':
        return await EmailService.sendEmailWithLogging(job.data.emailData);
      
      case 'send-bulk-email':
        return await EmailService.sendBulkEmails(job.data.bulkEmailData);
      
      case 'send-marketing-campaign':
        return await this.processCampaign(job.data.campaignData);
      
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  // Process marketing campaign
  async processCampaign(campaignData) {
    const { users, templateData, campaignId } = campaignData;
    let processed = 0;
    const total = users.length;

    for (let i = 0; i < users.length; i += EMAIL_CONFIG.BATCH_SIZE) {
      const batch = users.slice(i, i + EMAIL_CONFIG.BATCH_SIZE);
      
      const batchPromises = batch.map(async (user) => {
        try {
          await EmailService.sendEmailWithLogging({
            ...templateData,
            to: user.email,
            templateData: { ...templateData.templateData, name: user.name },
            userId: user._id,
            campaignId
          });
          processed++;
        } catch (error) {
          console.error(`Failed to send email to ${user.email}:`, error.message);
        }
      });

      await Promise.allSettled(batchPromises);
      
      // Delay between batches
      if (i + EMAIL_CONFIG.BATCH_SIZE < users.length) {
        await new Promise(resolve => setTimeout(resolve, EMAIL_CONFIG.DELAY_BETWEEN_BATCHES));
      }
    }

    return {
      campaignId,
      totalUsers: total,
      processedCount: processed,
      successRate: ((processed / total) * 100).toFixed(2)
    };
  }

  // Get queue statistics
  async getQueueStats() {
    return { ...this.stats, total: Object.values(this.stats).reduce((a, b) => a + b, 0) };
  }

  // Get failed jobs (simplified)
  async getFailedJobs(limit = 20) {
    return []; // Simplified - no persistent failed job storage
  }

  // Retry failed jobs (simplified)
  async retryFailedJobs(jobIds = []) {
    return { retriedCount: 0 }; // Simplified
  }

  // Clean old jobs (no-op for in-memory)
  async cleanOldJobs() {
    return true;
  }

  // Pause/Resume queue
  async pauseQueue() {
    this.processing = false;
  }

  async resumeQueue() {
    if (!this.processing) {
      this.processQueue();
    }
  }

  // Get queue health status
  async getHealthStatus() {
    const stats = await this.getQueueStats();
    
    return {
      isHealthy: stats.failed < 10 && stats.active < 100,
      stats,
      recentFailures: [],
      timestamp: new Date().toISOString()
    };
  }
}

// Simple queue implementation without Redis
class EmailQueue {
  constructor() {
    this.simpleQueue = new SimpleEmailQueue();
  }

  // Add single email to queue
  async addSingleEmail(emailData, options = {}) {
    return await this.simpleQueue.add('send-single-email', { emailData }, options);
  }

  // Add bulk email to queue
  async addBulkEmail(bulkEmailData, options = {}) {
    return await this.simpleQueue.add('send-bulk-email', { bulkEmailData }, options);
  }

  // Add marketing campaign to queue
  async addMarketingCampaign(campaignData, options = {}) {
    return await this.simpleQueue.add('send-marketing-campaign', { campaignData }, options);
  }

  // Get queue statistics
  async getQueueStats() {
    return await this.simpleQueue.getQueueStats();
  }

  // Get failed jobs
  async getFailedJobs(limit = 20) {
    return await this.simpleQueue.getFailedJobs(limit);
  }

  // Retry failed jobs
  async retryFailedJobs(jobIds = []) {
    return await this.simpleQueue.retryFailedJobs(jobIds);
  }

  // Clean old jobs
  async cleanOldJobs() {
    return await this.simpleQueue.cleanOldJobs();
  }

  // Pause/Resume queue
  async pauseQueue() {
    return await this.simpleQueue.pauseQueue();
  }

  async resumeQueue() {
    return await this.simpleQueue.resumeQueue();
  }

  // Get queue health status
  async getHealthStatus() {
    return await this.simpleQueue.getHealthStatus();
  }
}

// Export singleton instance
export default new EmailQueue();
