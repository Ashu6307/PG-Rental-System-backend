import authMeRouter from './routes/authMe.js';
import ownerWebhookLogsRoutes from './routes/ownerWebhookLogs.js';
import contentRoutes from './routes/content.js';
import offersRoutes from './routes/offersSimple.js';
import ownersRoutes from './routes/ownersSimple.js';
import citiesRoutes from './routes/cities.js';
import userDashboardRoutes from './routes/userDashboard.js';
import favoritesRoutes from './routes/favorites.js';
import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimiter from './middleware/rateLimit.js';
import logger from './utils/logger.js';
import errorHandler from './middleware/errorHandler.js';
import websocketService from './services/websocketService.js';
import adminRoutes from './routes/admin.js';
import bookingRoutes from './routes/bookings.js';
import pgRoutes from './routes/pg.js';
import roomRoutes from './routes/roomRoutes.js';
import flatRoutes from './routes/flats.js';
import authRoutes from './routes/auth.js';
import homeRoutes from './routes/home.js';
import otpRoutes from './routes/otp.js';
import forgotPasswordRoutes from './routes/forgotPassword.js';
import softDeleteRoutes from './routes/softDelete.js';
import ownerBookingsRoutes from './routes/ownerBookings.js';
import ownerRevenueRoutes from './routes/ownerRevenue.js';
import ownerDocumentsRoutes from './routes/ownerDocuments.js';
import ownerProfileRoutes from './routes/ownerProfile.js';
import uploadRoutes from './routes/upload.js';
import ownerNotificationsRoutes from './routes/ownerNotifications.js';
import ownerReviewsRoutes from './routes/ownerReviews.js';
import ownerFavoritesRoutes from './routes/ownerFavorites.js';
import ownerAuditLogsRoutes from './routes/ownerAuditLogs.js';
import ownerGDPRConsentRoutes from './routes/ownerGDPRConsent.js';
import ownerTenantsRoutes from './routes/ownerTenants.js';
import ownerAnalyticsRoutes from './routes/ownerAnalytics.js';
import ownerDashboardRoutes from './routes/ownerDashboard.js';
import ownerNotificationPreferencesRoutes from './routes/ownerNotificationPreferences.js';
import ownerRateLimitFeedbacksRoutes from './routes/ownerRateLimitFeedbacks.js';
import ownerVersionedSettingsRoutes from './routes/ownerVersionedSettings.js';
import userLoyaltyRoutes from './routes/userLoyalty.js';
import usersRoutes from './routes/users.js';
import notificationsRoutes from './routes/notifications.js';
import statsRouter from './routes/stats.js';
import invoicesRoutes from './routes/invoices.js';
import billingRoutes from './routes/billing.js';
import websocketRoutes from './routes/websocket.js';


dotenv.config({ quiet: true });
const app = express();
const server = http.createServer(app);

// Initialize WebSocket service
websocketService.initialize(server);

app.set('trust proxy', 1); // Fixes rate-limit X-Forwarded-For warning

// Configure CORS properly for credentials
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3500', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(rateLimiter);

// Professional logging middleware
app.use(logger.logRequest.bind(logger));

// Only apply checkJwtExpiry to protected routes, not public
// app.use(checkJwtExpiry); // DO NOT use globally

// Example: app.use('/api/protected', checkJwtExpiry, protectedRoutes);

// Make sure /api/home is registered BEFORE any protected routes
app.use('/api/home', homeRoutes); // /api/home public

// Public routes (no auth required)
app.use('/api/cities', citiesRoutes); // Cities list
app.use('/api/pgs', pgRoutes); // Public PG listings
app.use('/api/rooms', roomRoutes); // Public Room listings
app.use('/api/flats', flatRoutes); // Public Flat listings
app.use('/api/offers', offersRoutes); // Public offers
app.use('/api/auth', authRoutes); // Authentication
app.use('/api/user', authMeRouter); // Auth/me endpoint for user profile
app.use('/api/admin', adminRoutes); // Admin authentication and management
app.use('/api/otp', otpRoutes); // OTP verification
app.use('/api/forgot-password', forgotPasswordRoutes); // Password reset
app.use('/api/soft-delete', softDeleteRoutes); // Soft delete operations

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pg_room_rental', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  logger.info('MongoDB connected successfully');
  
  // Initialize billing scheduler after DB connection
  try {
    const billingScheduler = (await import('./services/billingScheduler.js')).default;
    await billingScheduler.initialize();
    logger.info('Billing scheduler initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize billing scheduler', { error: error.message });
  }
})
.catch((error) => {
  logger.error('MongoDB connection failed', { error: error.message });
  process.exit(1);
});
app.use('/api/owners', ownersRoutes); // Owner dashboard and management
app.use('/api/owner/bookings', ownerBookingsRoutes);
app.use('/api/owner/revenue', ownerRevenueRoutes);
app.use('/api/owner/documents', ownerDocumentsRoutes);
app.use('/api/owner/profile', ownerProfileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/owner/notifications', ownerNotificationsRoutes);
app.use('/api/owner/reviews', ownerReviewsRoutes);
app.use('/api/owner/favorites', ownerFavoritesRoutes);
app.use('/api/owner/auditlogs', ownerAuditLogsRoutes);
app.use('/api/owner/gdprconsent', ownerGDPRConsentRoutes);
app.use('/api/owner/tenants', ownerTenantsRoutes);
app.use('/api/owner/analytics', ownerAnalyticsRoutes);
app.use('/api/owner/dashboard', ownerDashboardRoutes);
app.use('/api/owner/notification-preferences', ownerNotificationPreferencesRoutes);
app.use('/api/owner/webhook-logs', ownerWebhookLogsRoutes);
app.use('/api/owner/rate-limit-feedbacks', ownerRateLimitFeedbacksRoutes);
app.use('/api/owner/versioned-settings', ownerVersionedSettingsRoutes);

// Enhanced Email System Routes
import { emailRoutes } from './modules/email/index.js';
app.use('/api/emails', emailRoutes);

// City-wise Admin Management Routes
import adminCityRoutes from './routes/adminCity.js';
app.use('/api/admin/cities', adminCityRoutes);

// User Inquiry System Routes (Admin-Mediated Communication)
import inquiryRoutes from './routes/inquiry.js';
app.use('/api/inquiries', inquiryRoutes);

// User-specific protected routes (These routes already have their own auth middleware)
app.use('/api/users', usersRoutes);
app.use('/api/user/dashboard', userDashboardRoutes); // User Dashboard APIs
app.use('/api/favorites', favoritesRoutes); // User Favorites Management
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/user-loyalty', userLoyaltyRoutes);
app.use('/api/invoices', invoicesRoutes); // Invoice management
app.use('/api/billing', billingRoutes); // Billing automation and management
app.use('/api/websocket', websocketRoutes); // WebSocket real-time updates

app.use('/api/stats', statsRouter);
app.use('/api/content', contentRoutes);


mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

// Health check route
app.get('/', (req, res) => {
  res.send('PG & Room Rental System Backend Running');
});


// Contact route for public contact form
import contactRoutes from './routes/contact.js';
app.use('/api/contacts', contactRoutes);

// ...existing code...

// Global error handler (must be last middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, { 
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    timestamp: new Date().toISOString(),
    websocket: 'enabled'
  });
});
