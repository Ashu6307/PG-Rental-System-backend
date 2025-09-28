
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
let RateLimitLog;
try {
  RateLimitLog = mongoose.models.RateLimitLog || (await import('../models/RateLimitLog.js')).default;
} catch (e) {
  RateLimitLog = null;
}

// Production-ready rate limiting configuration
const createRateLimiter = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    
    // Skip rate limiting for certain conditions
    skip: (req) => {
      // Skip for specific endpoints that need high throughput
      const skipPaths = ['/api/health', '/api/metrics'];
      return skipPaths.includes(req.path);
    },
    
    // Remove custom keyGenerator to use default (fixes IPv6 issue)
    // Default keyGenerator automatically handles IPv6 properly
    
    // Custom rate limit per endpoint
    max: (req) => {
      const limits = {
        // Authentication endpoints - higher limits for login/register
        '/api/auth/login': 500,
        '/api/auth/register': 500,
        '/api/auth/owner-login': 500,
        '/api/otp/send-otp': 200,
        
        // Search and listing endpoints - very high limits
        '/api/pg': 2000,
        '/api/home': 1000,
        
        // User dashboard endpoints - high limits
        '/api/bookings': 1000,
        '/api/users': 800,
        
        // Admin endpoints - moderate limits
        '/api/admin': 300,
        
        // Default limit for other endpoints
        default: isProduction ? 5000 : 10000
      };
      
      // Find matching endpoint limit
      for (const [path, limit] of Object.entries(limits)) {
        if (req.path.startsWith(path)) {
          return limit;
        }
      }
      
      return limits.default;
    },
    
    message: {
      error: 'Too many requests, please try again later.',
      retryAfter: '15 minutes',
      tip: 'For high-volume usage, consider upgrading to premium plan'
    },
    
    standardHeaders: true,
    legacyHeaders: false,
    
    // Enhanced handler with better error tracking
    handler: async (req, res, next) => {
      // Log blocked request with more details
      try {
        if (RateLimitLog) {
          await RateLimitLog.create({
            user: req.user?._id,
            ip: req.ip,
            endpoint: req.originalUrl,
            method: req.method,
            status: 'blocked',
            reason: 'Rate limit exceeded',
            userAgent: req.get('User-Agent'),
            timestamp: new Date()
          });
        }
      } catch (err) {
        console.log('Rate limit logging error:', err.message);
      }
      
      res.status(429).json({ 
        success: false,
        message: 'Too many requests, please try again later.',
        retryAfter: Math.ceil(req.rateLimit.resetTime - Date.now()) / 1000,
        limit: req.rateLimit.limit,
        remaining: req.rateLimit.remaining,
        resetTime: new Date(req.rateLimit.resetTime).toISOString()
      });
    }
  });
};

const limiter = createRateLimiter();

export default limiter;
