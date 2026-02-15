// controllers/notificationController.js
const NotificationService = require("../services/notificationService");
const expirationChecker = require("../jobs/expirationChecker");

// Get all notifications
const getNotifications = async (req, res) => {
  try {
    const { limit = 12, unreadOnly = false } = req.query;
    const notifications = await NotificationService.getRecentNotifications(
      parseInt(limit),
      unreadOnly === "true"
    );
    const unreadCount = await NotificationService.getUnreadCount();

    res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully",
      data: {
        notifications,
        unreadCount,
        total: notifications.length,
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notifications",
      error: error.message,
    });
  }
};

// Get notification by ID
const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await NotificationService.getNotificationById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification retrieved successfully",
      data: notification,
    });
  } catch (error) {
    console.error("Error fetching notification:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notification",
      error: error.message,
    });
  }
};

// Get unread count
const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await NotificationService.getUnreadCount();

    res.status(200).json({
      success: true,
      message: "Unread count retrieved successfully",
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching unread count",
      error: error.message,
    });
  }
};

// Create notification (for testing)
const createNotification = async (req, res) => {
  try {
    const { type, title, message, reference_id } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "type, title, and message are required",
      });
    }

    const notification = await NotificationService.createNotification({
      type,
      title,
      message,
      referenceId: reference_id,
    });

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({
      success: false,
      message: "Error creating notification",
      error: error.message,
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await NotificationService.markAsRead(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    const unreadCount = await NotificationService.getUnreadCount();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: {
        notification,
        unreadCount,
      },
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Error marking notification as read",
      error: error.message,
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const result = await NotificationService.markAllAsRead();

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: {
        updatedCount: result,
      },
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Error marking all notifications as read",
      error: error.message,
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await NotificationService.deleteNotification(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
      data: { id: parseInt(id) },
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting notification",
      error: error.message,
    });
  }
};



// Manually trigger stock level check (for testing)
const checkStockLevels = async (req, res) => {
  try {
    console.log('🔄 Manual stock level check triggered...');
    
    const stockLevelChecker = require('../jobs/stockLevelChecker');
    const result = await stockLevelChecker.forceCheck();
    
    res.status(200).json({
      success: true,
      message: 'Stock level check completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error during manual stock level check:', error);
    res.status(500).json({
      success: false,
      message: 'Error during stock level check',
      error: error.message
    });
  }
};

// Manually trigger expiration check (for testing)
const checkExpirations = async (req, res) => {
  try {
    console.log('🔄 Manual expiration check triggered...');
    await expirationChecker.runCheck();
    
    res.status(200).json({
      success: true,
      message: 'Expiration check completed successfully',
      data: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error during manual expiration check:', error);
    res.status(500).json({
      success: false,
      message: 'Error during expiration check',
      error: error.message
    });
  }
};

// Test Telegram + SMS stock alert (for testing)
const testStockAlert = async (req, res) => {
  try {
    const { productId, forceAlert = false } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'productId is required'
      });
    }

    console.log(`🔄 Testing stock alert for product ${productId}...`);
    
    // Get product with supplier data
    const db = require('../models');
    const { Product, Brand, Category, Supplier } = db;
    const smsService = require('../services/smsService');
    
    const product = await Product.findByPk(productId, {
      include: [
        { model: Brand, as: "Brand", attributes: ["name"] },
        { model: Category, as: "Category", attributes: ["name"] },
        {
          model: Supplier,
          as: "Supplier",
          attributes: ["id", "name", "telegram_chat_id", "phone_first", "phone_second"],
          required: false,
        },
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    let telegramSent = false;
    let smsSent = false;

    if (forceAlert && product.Supplier) {
      // Create test messages
      const telegramText = NotificationService.buildTelegramText({
        level: "CRITICAL",
        productName: product.name,
        brandName: product.Brand?.name || "Unknown Brand",
        categoryName: product.Category?.name || "Unknown Category",
        barcode: product.barcode || "-",
        qty: product.qty,
        threshold: 10,
      });

      const smsText = smsService.formatStockAlertSMS({
        level: "CRITICAL",
        productName: product.name,
        brandName: product.Brand?.name || "Unknown Brand",
        qty: product.qty,
        threshold: 10,
      });

      // Send alerts directly (bypass cooldown for testing)
      const alertResults = await NotificationService.sendSupplierAlert(product, telegramText);
      telegramSent = alertResults.telegram;
      
      if (product.Supplier.phone_first || product.Supplier.phone_second) {
        smsSent = await smsService.sendToSupplier(product.Supplier, smsText);
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Stock alert test completed',
      data: {
        productId,
        productName: product.name,
        supplierName: product.Supplier?.name || 'No supplier',
        hasTelegramChatId: !!product.Supplier?.telegram_chat_id,
        hasPhoneNumber: !!(product.Supplier?.phone_first || product.Supplier?.phone_second),
        phoneFirst: product.Supplier?.phone_first || null,
        phoneSecond: product.Supplier?.phone_second || null,
        telegramSent,
        smsSent,
        forceAlert,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error during stock alert test:', error);
    res.status(500).json({
      success: false,
      message: 'Error during stock alert test',
      error: error.message
    });
  }
};

module.exports = {
  getNotifications,
  getNotificationById,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  checkExpirations,
  checkStockLevels,
  testStockAlert,
};