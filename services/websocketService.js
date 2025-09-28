import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socket mapping
    this.userRooms = new Map(); // userId -> Set of rooms
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    console.log('WebSocket service initialized');
  }

  handleConnection(socket) {
    const userId = socket.user._id.toString();
    
    // Store user connection
    this.connectedUsers.set(userId, socket);
    
    // Join user-specific room
    const userRoom = `user:${userId}`;
    socket.join(userRoom);
    
    // Initialize user rooms set
    if (!this.userRooms.has(userId)) {
      this.userRooms.set(userId, new Set());
    }
    this.userRooms.get(userId).add(userRoom);

    console.log(`User ${socket.user.name} connected (${userId})`);

    // Send welcome message with current status
    socket.emit('connection:status', {
      status: 'connected',
      userId: userId,
      timestamp: new Date(),
      message: 'Real-time updates enabled'
    });

    // Handle dashboard subscription
    socket.on('dashboard:subscribe', () => {
      const dashboardRoom = `dashboard:${userId}`;
      socket.join(dashboardRoom);
      this.userRooms.get(userId).add(dashboardRoom);
      
      socket.emit('dashboard:subscribed', {
        room: dashboardRoom,
        timestamp: new Date()
      });
    });

    // Handle booking subscription
    socket.on('bookings:subscribe', () => {
      const bookingsRoom = `bookings:${userId}`;
      socket.join(bookingsRoom);
      this.userRooms.get(userId).add(bookingsRoom);
      
      socket.emit('bookings:subscribed', {
        room: bookingsRoom,
        timestamp: new Date()
      });
    });

    // Handle notifications subscription
    socket.on('notifications:subscribe', () => {
      const notificationsRoom = `notifications:${userId}`;
      socket.join(notificationsRoom);
      this.userRooms.get(userId).add(notificationsRoom);
      
      socket.emit('notifications:subscribed', {
        room: notificationsRoom,
        timestamp: new Date()
      });
    });

    // Handle analytics subscription
    socket.on('analytics:subscribe', () => {
      const analyticsRoom = `analytics:${userId}`;
      socket.join(analyticsRoom);
      this.userRooms.get(userId).add(analyticsRoom);
      
      socket.emit('analytics:subscribed', {
        room: analyticsRoom,
        timestamp: new Date()
      });
    });

    // Handle heartbeat
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User ${socket.user.name} disconnected: ${reason}`);
      this.connectedUsers.delete(userId);
      this.userRooms.delete(userId);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${userId}:`, error);
    });
  }

  // Broadcast methods for different types of updates
  broadcastBookingUpdate(userId, bookingData, action = 'update') {
    const userRoom = `user:${userId}`;
    const bookingsRoom = `bookings:${userId}`;
    const dashboardRoom = `dashboard:${userId}`;

    const update = {
      type: 'booking',
      action,
      data: bookingData,
      timestamp: new Date(),
      userId
    };

    // Send to specific rooms
    this.io.to(userRoom).emit('booking:update', update);
    this.io.to(bookingsRoom).emit('booking:update', update);
    this.io.to(dashboardRoom).emit('dashboard:update', {
      ...update,
      section: 'bookings'
    });
  }

  broadcastNotification(userId, notificationData) {
    const userRoom = `user:${userId}`;
    const notificationsRoom = `notifications:${userId}`;
    const dashboardRoom = `dashboard:${userId}`;

    const notification = {
      type: 'notification',
      data: notificationData,
      timestamp: new Date(),
      userId
    };

    this.io.to(userRoom).emit('notification:new', notification);
    this.io.to(notificationsRoom).emit('notification:update', notification);
    this.io.to(dashboardRoom).emit('dashboard:update', {
      ...notification,
      section: 'notifications'
    });
  }

  broadcastAnalyticsUpdate(userId, analyticsData, section = 'general') {
    const userRoom = `user:${userId}`;
    const analyticsRoom = `analytics:${userId}`;
    const dashboardRoom = `dashboard:${userId}`;

    const update = {
      type: 'analytics',
      section,
      data: analyticsData,
      timestamp: new Date(),
      userId
    };

    this.io.to(userRoom).emit('analytics:update', update);
    this.io.to(analyticsRoom).emit('analytics:update', update);
    this.io.to(dashboardRoom).emit('dashboard:update', {
      ...update,
      section: 'analytics'
    });
  }

  broadcastFavoriteUpdate(userId, favoriteData, action = 'update') {
    const userRoom = `user:${userId}`;
    const dashboardRoom = `dashboard:${userId}`;

    const update = {
      type: 'favorite',
      action,
      data: favoriteData,
      timestamp: new Date(),
      userId
    };

    this.io.to(userRoom).emit('favorite:update', update);
    this.io.to(dashboardRoom).emit('dashboard:update', {
      ...update,
      section: 'favorites'
    });
  }

  // System-wide broadcasts
  broadcastSystemUpdate(data) {
    this.io.emit('system:update', {
      type: 'system',
      data,
      timestamp: new Date()
    });
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Check if user is connected
  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }

  // Send direct message to user
  sendToUser(userId, event, data) {
    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.emit(event, {
        ...data,
        timestamp: new Date()
      });
      return true;
    }
    return false;
  }

  // Cleanup method
  cleanup() {
    if (this.io) {
      this.io.close();
      this.connectedUsers.clear();
      this.userRooms.clear();
    }
  }
}

// Singleton instance
const websocketService = new WebSocketService();

export default websocketService;