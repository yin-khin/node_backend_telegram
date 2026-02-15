// routes/notificationRoutes-noauth.js (for testing without authentication)
const { 
  getNotifications, 
  getNotificationById,
  markAsRead, 
  markAllAsRead,
  createNotification,
  deleteNotification,
  getUnreadCount,
  // createSampleNotifications,
  checkExpirations
} = require('../controllers/notificationController');

const NotificationRoutes = (app) => {
  // Get all notifications (no auth for testing)
  app.get('/api/notifications', getNotifications);
  
  // Get notification by ID (no auth for testing)
  app.get('/api/notifications/:id', getNotificationById);
  
  // Get unread count (no auth for testing)
  app.get('/api/notifications/unread/count', getUnreadCount);
  
  // Create notification (for testing - no auth)
  app.post('/api/notifications', createNotification);
  
  // // Create sample notifications (for testing - no auth)
  // app.post('/api/notifications/samples/create', createSampleNotifications);
  
  // Manual expiration check (for testing - no auth)
  app.post('/api/notifications/check-expirations', checkExpirations);
  
  // Mark notification as read (no auth for testing)
  app.patch('/api/notifications/:id/read', markAsRead);
  
  // Mark all notifications as read (no auth for testing)
  app.patch('/api/notifications/read/all', markAllAsRead);
  
  // Delete notification (no auth for testing)
  app.delete('/api/notifications/:id', deleteNotification);
};

module.exports = NotificationRoutes;