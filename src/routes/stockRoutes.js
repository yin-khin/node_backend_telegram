// src/routes/stockRoutes.js
const stockLevelChecker = require('../jobs/stockLevelChecker');
const NotificationService = require('../services/notificationService');
const auth = require('../middlewares/auth.middleware');

const stockRoutes = (app) => {
  // Manual stock level check
  app.post('/api/stock/check', auth.validate_token(), async (req, res) => {
    try {
      const result = await stockLevelChecker.runManualCheck();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error running stock check',
        error: error.message
      });
    }
  });

  // Force immediate stock level check
  app.post('/api/stock/force-check', auth.validate_token(), async (req, res) => {
    try {
      const result = await stockLevelChecker.forceCheck();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error running forced stock check',
        error: error.message
      });
    }
  });

  // Get stock checker status
  app.get('/api/stock/status', auth.validate_token(), (req, res) => {
    try {
      const status = stockLevelChecker.getStatus();
      res.status(200).json({
        success: true,
        message: 'Stock checker status retrieved',
        data: status
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting stock checker status',
        error: error.message
      });
    }
  });

  // Start stock checker
  app.post('/api/stock/start', auth.validate_token(), (req, res) => {
    try {
      stockLevelChecker.start();
      res.status(200).json({
        success: true,
        message: 'Stock level checker started',
        data: stockLevelChecker.getStatus()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error starting stock checker',
        error: error.message
      });
    }
  });

  // Stop stock checker
  app.post('/api/stock/stop', auth.validate_token(), (req, res) => {
    try {
      stockLevelChecker.stop();
      res.status(200).json({
        success: true,
        message: 'Stock level checker stopped',
        data: stockLevelChecker.getStatus()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error stopping stock checker',
        error: error.message
      });
    }
  });

  // Update stock thresholds
  app.put('/api/stock/thresholds', auth.validate_token(), (req, res) => {
    try {
      const { lowStock = 10, criticalStock = 5 } = req.body;
      
      if (criticalStock >= lowStock) {
        return res.status(400).json({
          success: false,
          message: 'Critical stock threshold must be less than low stock threshold'
        });
      }

      stockLevelChecker.updateThresholds(lowStock, criticalStock);
      
      res.status(200).json({
        success: true,
        message: 'Stock thresholds updated',
        data: {
          lowStockThreshold: lowStock,
          criticalStockThreshold: criticalStock
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating stock thresholds',
        error: error.message
      });
    }
  });

  // Update check interval
  app.put('/api/stock/interval', auth.validate_token(), (req, res) => {
    try {
      const { minutes = 30 } = req.body;
      
      if (minutes < 5) {
        return res.status(400).json({
          success: false,
          message: 'Check interval must be at least 5 minutes'
        });
      }

      stockLevelChecker.updateInterval(minutes);
      
      res.status(200).json({
        success: true,
        message: 'Check interval updated',
        data: {
          checkIntervalMinutes: minutes
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating check interval',
        error: error.message
      });
    }
  });

  // Get low stock products (for dashboard/reports)
  app.get('/api/stock/low', auth.validate_token(), async (req, res) => {
    try {
      const { threshold = 10 } = req.query;
      const db = require('../models');
      const Product = db.Product;
      const Brand = db.Brand;
      const Category = db.Category;

      const lowStockProducts = await Product.findAll({
        where: {
          qty: {
            [db.Sequelize.Op.lte]: parseInt(threshold)
          }
        },
        include: [
          { model: Brand, as: "Brand", attributes: ["name"] },
          { model: Category, as: "Category", attributes: ["name"] }
        ],
        order: [['qty', 'ASC']]
      });

      res.status(200).json({
        success: true,
        message: 'Low stock products retrieved',
        data: {
          products: lowStockProducts,
          count: lowStockProducts.length,
          threshold: parseInt(threshold)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting low stock products',
        error: error.message
      });
    }
  });
};

module.exports = stockRoutes;