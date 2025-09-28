import websocketService from '../services/websocketService.js';

// Real-time booking update handler
export const broadcastBookingUpdate = async (req, res) => {
  try {
    const { bookingId, action, userId } = req.body;
    
    // Mock booking data - in real app, fetch from database
    const bookingData = {
      _id: bookingId,
      propertyName: 'Modern Apartment Downtown',
      guestName: 'John Doe',
      checkIn: new Date(),
      checkOut: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days later
      amount: 1200,
      status: action,
      timestamp: new Date()
    };

    // Broadcast to specific user
    websocketService.broadcastBookingUpdate(userId, bookingData, action);

    res.json({
      success: true,
      message: 'Booking update broadcasted',
      data: bookingData
    });
  } catch (error) {
    console.error('Error broadcasting booking update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to broadcast booking update',
      error: error.message
    });
  }
};

// Real-time notification sender
export const sendNotification = async (req, res) => {
  try {
    const { userId, title, message, priority = 'medium', type = 'info' } = req.body;
    
    const notificationData = {
      _id: `notif_${Date.now()}`,
      title,
      message,
      priority,
      type,
      timestamp: new Date(),
      read: false
    };

    // Broadcast to specific user
    websocketService.broadcastNotification(userId, notificationData);

    res.json({
      success: true,
      message: 'Notification sent',
      data: notificationData
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
};

// Real-time analytics update
export const broadcastAnalyticsUpdate = async (req, res) => {
  try {
    const { userId, section = 'general', metrics } = req.body;
    
    const analyticsData = {
      section,
      metrics: metrics || {
        totalBookings: Math.floor(Math.random() * 100),
        revenue: Math.floor(Math.random() * 50000),
        occupancyRate: Math.floor(Math.random() * 100),
        lastUpdated: new Date()
      },
      timestamp: new Date()
    };

    // Broadcast to specific user
    websocketService.broadcastAnalyticsUpdate(userId, analyticsData, section);

    res.json({
      success: true,
      message: 'Analytics update broadcasted',
      data: analyticsData
    });
  } catch (error) {
    console.error('Error broadcasting analytics update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to broadcast analytics update',
      error: error.message
    });
  }
};

// System status endpoint
export const getSystemStatus = async (req, res) => {
  try {
    const connectedUsers = websocketService.getConnectedUsersCount();
    
    res.json({
      success: true,
      data: {
        connectedUsers,
        uptime: process.uptime(),
        timestamp: new Date(),
        websocketStatus: 'active'
      }
    });
  } catch (error) {
    console.error('Error getting system status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system status',
      error: error.message
    });
  }
};

// Test WebSocket connectivity
export const testWebSocket = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Send test message
    const testData = {
      message: 'WebSocket test successful',
      timestamp: new Date(),
      testId: `test_${Date.now()}`
    };

    const sent = websocketService.sendToUser(userId, 'test:message', testData);
    
    res.json({
      success: true,
      message: sent ? 'Test message sent' : 'User not connected',
      data: testData,
      userConnected: sent
    });
  } catch (error) {
    console.error('Error testing WebSocket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test WebSocket',
      error: error.message
    });
  }
};

// Trigger sample real-time updates for demonstration
export const triggerSampleUpdates = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!websocketService.isUserConnected(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User not connected to WebSocket'
      });
    }

    // Send sample booking update
    setTimeout(() => {
      websocketService.broadcastBookingUpdate(userId, {
        _id: 'sample_booking_1',
        propertyName: 'Luxury Apartment',
        guestName: 'Sample Guest',
        checkIn: new Date(),
        amount: 2500,
        status: 'confirmed'
      }, 'confirmed');
    }, 1000);

    // Send sample notification
    setTimeout(() => {
      websocketService.broadcastNotification(userId, {
        _id: 'sample_notif_1',
        title: 'New Booking Request',
        message: 'You have received a new booking request for your property',
        priority: 'high',
        type: 'booking'
      });
    }, 3000);

    // Send sample analytics update
    setTimeout(() => {
      websocketService.broadcastAnalyticsUpdate(userId, {
        totalBookings: Math.floor(Math.random() * 100),
        revenue: Math.floor(Math.random() * 50000),
        newUsers: Math.floor(Math.random() * 20),
        conversionRate: (Math.random() * 10 + 15).toFixed(1)
      }, 'revenue');
    }, 5000);

    res.json({
      success: true,
      message: 'Sample updates triggered successfully',
      note: 'Updates will be sent over the next 5 seconds'
    });
  } catch (error) {
    console.error('Error triggering sample updates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger sample updates',
      error: error.message
    });
  }
};