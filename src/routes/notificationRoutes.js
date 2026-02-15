// routes/notificationRoutes.js
const { 
  getNotifications, 
  getNotificationById,
  markAsRead, 
  markAllAsRead,
  createNotification,
  deleteNotification,
  getUnreadCount,
  checkStockLevels,
  testStockAlert,
  checkExpirations,
  // createSampleNotifications
} = require('../controllers/notificationController');
const auth = require('../middlewares/auth.middleware');

const NotificationRoutes = (app) => {
  // Get all notifications (requires authentication)
  app.get('/api/notifications', auth.validate_token(), getNotifications);
  
  // Get unread count (requires authentication) - MUST be before /:id route
  app.get('/api/notifications/unread/count', auth.validate_token(), getUnreadCount);
  
  // Get notification by ID (requires authentication)
  app.get('/api/notifications/:id', auth.validate_token(), getNotificationById);
  
  // Create notification (for testing - requires authentication)
  app.post('/api/notifications', auth.validate_token(), createNotification);
  
  // Create sample notifications (for testing - requires authentication)
  // app.post('/api/notifications/samples/create', auth.validate_token(), createSampleNotifications);
  
  // Mark notification as read (requires authentication)
  app.patch('/api/notifications/:id/read', auth.validate_token(), markAsRead);
  
  // Mark all notifications as read (requires authentication)
  app.patch('/api/notifications/read/all', auth.validate_token(), markAllAsRead);
  
  // Delete notification (requires authentication)
  app.delete('/api/notifications/:id', auth.validate_token(), deleteNotification);
  
  // Manual testing endpoints (requires authentication)
  app.post('/api/notifications/stock/check', auth.validate_token(), checkStockLevels);
  app.post('/api/notifications/expiration/check', auth.validate_token(), checkExpirations);
  app.post('/api/notifications/test/stock-alert', auth.validate_token(), testStockAlert);
  
  // Test endpoint without auth for debugging
  app.get('/api/test/stock-check', async (req, res) => {
    try {
      console.log('🔄 Manual test stock check triggered...');
      const stockLevelChecker = require('../jobs/stockLevelChecker');
      const result = await stockLevelChecker.forceCheck();
      res.json({ success: true, result });
    } catch (error) {
      console.error('❌ Test stock check error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Debug endpoint to check product details
  app.get('/api/test/products-debug', async (req, res) => {
    try {
      const db = require('../models');
      const { Product, Brand, Category, Supplier } = db;
      
      const products = await Product.findAll({
        include: [
          { model: Brand, as: "Brand", attributes: ["name"] },
          { model: Category, as: "Category", attributes: ["name"] },
          {
            model: Supplier,
            as: "Supplier",
            attributes: ["id", "name", "phone_first", "phone_second", "telegram_chat_id"],
            required: false,
          },
        ],
      });
      
      const productDetails = products.map(p => {
        const qty = Number(p.qty || 0);
        let stockLevel = "OK";
        if (qty === 0) stockLevel = "OUT OF STOCK";
        else if (qty <= 5) stockLevel = "CRITICAL";
        else if (qty <= 10) stockLevel = "LOW";
        
        return {
          id: p.id,
          name: p.name,
          qty: p.qty,
          stockLevel,
          brand: p.Brand?.name,
          category: p.Category?.name,
          supplier: p.Supplier ? {
            id: p.Supplier.id,
            name: p.Supplier.name,
            phone_first: p.Supplier.phone_first,
            phone_second: p.Supplier.phone_second,
            telegram_chat_id: p.Supplier.telegram_chat_id
          } : null
        };
      });
      
      console.log('📊 Product stock levels:', JSON.stringify(productDetails, null, 2));
      res.json({ success: true, products: productDetails });
    } catch (error) {
      console.error('❌ Products debug error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Force send alerts bypassing cooldown (for testing)
  app.get('/api/test/force-alert/:productId', async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      console.log(`🚨 Force sending alerts for product ${productId}...`);
      
      const db = require('../models');
      const { Product, Brand, Category, Supplier } = db;
      const NotificationService = require('../services/notificationService');
      const smsService = require('../services/smsService');
      
      const product = await Product.findByPk(productId, {
        include: [
          { model: Brand, as: "Brand", attributes: ["name"] },
          { model: Category, as: "Category", attributes: ["name"] },
          {
            model: Supplier,
            as: "Supplier",
            attributes: ["id", "name", "phone_first", "phone_second", "telegram_chat_id"],
            required: false,
          },
        ],
      });
      
      if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }
      
      if (!product.Supplier) {
        return res.status(400).json({ success: false, error: 'Product has no supplier' });
      }
      
      const qty = Number(product.qty || 0);
      let level = "OUT";
      if (qty > 0 && qty <= 5) level = "CRITICAL";
      else if (qty > 5 && qty <= 10) level = "LOW";
      else if (qty > 10) level = "OK";
      
      if (level === "OK") {
        return res.json({ success: true, message: 'Product stock is OK, no alert needed', level, qty });
      }
      
      // Build messages
      const telegramText = NotificationService.buildTelegramText({
        level,
        productName: product.name,
        brandName: product.Brand?.name || "Unknown Brand",
        categoryName: product.Category?.name || "Unknown Category",
        barcode: product.barcode || "-",
        qty,
        low: 10,
        critical: 5,
      });

      const smsText = smsService.formatStockAlertSMS({
        level,
        productName: product.name,
        brandName: product.Brand?.name || "Unknown Brand",
        qty,
        threshold: level === "OUT" ? 0 : (level === "CRITICAL" ? 5 : 10),
      });
      
      // Send alerts directly
      const alertResults = await NotificationService.notifySupplier(product, { telegramText, smsText });
      
      console.log(`📊 Alert results: Telegram=${alertResults.telegram}, SMS=${alertResults.sms}`);
      
      res.json({ 
        success: true, 
        product: {
          id: product.id,
          name: product.name,
          qty: product.qty,
          level
        },
        supplier: {
          id: product.Supplier.id,
          name: product.Supplier.name,
          phone_first: product.Supplier.phone_first,
          phone_second: product.Supplier.phone_second,
          telegram_chat_id: product.Supplier.telegram_chat_id
        },
        alerts: {
          telegramSent: alertResults.telegram,
          smsSent: alertResults.sms
        },
        messages: {
          telegram: telegramText,
          sms: smsText
        }
      });
    } catch (error) {
      console.error('❌ Force alert error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
};

module.exports = NotificationRoutes;