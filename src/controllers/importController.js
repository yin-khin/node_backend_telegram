const { Op } = require('sequelize');
const sequelize = require('../config/db');
const db = require('../models');
const Purchase = db.Purchase;
const PurchaseItem = db.PurchaseItem;
const Product = db.Product;
const Supplier = db.Supplier;
const NotificationService = require('../services/notificationService');

// Create a new import (purchase)
const createImport = async (req, res) => {
  const { supplier_id, items, paid } = req.body;
  
  try {
    // Calculate total
    const total = items.reduce((sum, item) => {
      return sum + (item.qty * item.cost_price);
    }, 0);

    // Start transaction
    const result = await sequelize.transaction(async (t) => {
      // Create purchase
      const purchase = await Purchase.create({
        supplier_id,
        total,
        paid: paid || 0,
        balance: total - (paid || 0)
      }, { transaction: t });

      // Create purchase items and update product quantities
      const purchaseItems = await Promise.all(items.map(async (item) => {
        const purchaseItem = await PurchaseItem.create({
          purchase_id: purchase.id,
          product_id: item.product_id,
          qty: item.qty,
          cost_price: item.cost_price,
          sale_price: item.sale_price,
          manufacture_date: item.manufacture_date,
          expire_date: item.expire_date
        }, { transaction: t });

        // Update product stock and cost price
        const product = await Product.findByPk(item.product_id, { transaction: t });
        if (product) {
          const newQty = (product.qty || 0) + item.qty;
          await product.update({
            qty: newQty,
            cost_price: item.cost_price, // Update to latest cost price
            sale_price: item.sale_price  // Update to latest sale price
          }, { transaction: t });

          // Check stock levels and create notifications after quantity update
          try {
            await NotificationService.checkProductStockLevel(product.id);
          } catch (notificationError) {
            console.error('Error checking stock levels after import:', notificationError);
            // Don't fail the import if notification fails
          }
        }

        return purchaseItem;
      }));

      return { purchase, items: purchaseItems };
    });

    // Create purchase notification
    try {
      const supplier = await Supplier.findByPk(supplier_id);
      const supplierName = supplier ? supplier.name : 'Unknown Supplier';
      const itemCount = items.length;
      const totalAmount = `$${parseFloat(total).toFixed(2)}`;
      
      await NotificationService.createNotification({
        type: 'purchase_new',
        title: 'ការទិញថ្មី - New Purchase',
        message: `ការទិញ #${result.purchase.id} បានទទួលពីអ្នកផ្គត់ផ្គង់ ${supplierName}. សរុប: ${totalAmount}. ផលិតផល: ${itemCount}`,
        referenceId: result.purchase.id
      });
      console.log(`✅ Purchase notification created for purchase #${result.purchase.id}`);
    } catch (notificationError) {
      console.error('Error creating purchase notification:', notificationError);
      // Don't fail the purchase if notification fails
    }

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error creating import:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating import',
      error: error.message
    });
  }
};

// Get all imports with filters
const getImports = async (req, res) => {
  const { startDate, endDate, supplierId } = req.query;
  
  try {
    const where = {};
    
    // Add date filter if provided
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    // Add supplier filter if provided
    if (supplierId) {
      where.supplier_id = supplierId;
    }
    
    const imports = await Purchase.findAll({
      where,
      include: [
        {
          model: Supplier,
          attributes: ['id', 'name', 'phone']
        },
        {
          model: PurchaseItem,
          as: 'PurchaseItems',
          include: [{
            model: Product,
            attributes: ['id', 'name', 'barcode']
          }]
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      count: imports.length,
      data: imports
    });
  } catch (error) {
    console.error('Error fetching imports:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching imports',
      error: error.message
    });
  }
};

// Get import by ID
const getImportById = async (req, res) => {
  try {
    const importData = await Purchase.findByPk(req.params.id, {
      include: [
        {
          model: Supplier,
          attributes: ['id', 'name', 'phone', 'address']
        },
        {
          model: PurchaseItem,
          as: 'PurchaseItems',
          include: [{
            model: Product,
            attributes: ['id', 'name', 'barcode', 'category_id', 'brand_id']
          }]
        }
      ]
    });

    if (!importData) {
      return res.status(404).json({
        success: false,
        message: 'Import not found'
      });
    }

    res.status(200).json({
      success: true,
      data: importData
    });
  } catch (error) {
    console.error('Error fetching import:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching import',
      error: error.message
    });
  }
};

// Generate import report
const generateImportReport = async (req, res) => {
  const { startDate, endDate, supplierId } = req.query;
  
  try {
    const where = {};
    
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    if (supplierId) {
      where.supplier_id = supplierId;
    }
    
    const imports = await Purchase.findAll({
      where,
      include: [
        {
          model: Supplier,
          attributes: ['name']
        },
        {
          model: PurchaseItem,
          as: 'PurchaseItems',
          include: [{
            model: Product,
            attributes: ['name']
          }]
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    // Calculate summary
    const summary = {
      totalImports: imports.length,
      totalAmount: imports.reduce((sum, imp) => sum + parseFloat(imp.total), 0),
      totalPaid: imports.reduce((sum, imp) => sum + parseFloat(imp.paid), 0),
      totalBalance: imports.reduce((sum, imp) => sum + parseFloat(imp.balance), 0),
      items: []
    };
    
    // Group by product for item-wise summary
    const productSummary = {};
    
    imports.forEach(imp => {
      if (imp.PurchaseItems && Array.isArray(imp.PurchaseItems)) {
        imp.PurchaseItems.forEach(item => {
          const productName = item.Product ? item.Product.name : 'Unknown';
          if (!productSummary[productName]) {
            productSummary[productName] = {
              name: productName,
              quantity: 0,
              totalCost: 0
            };
          }
          productSummary[productName].quantity += item.qty;
          productSummary[productName].totalCost += item.qty * item.cost_price;
        });
      }
    });
    
    summary.items = Object.values(productSummary);
    
    res.status(200).json({
      success: true,
      data: {
        imports,
        summary
      }
    });
  } catch (error) {
    console.error('Error generating import report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating import report',
      error: error.message
    });
  }
};

module.exports = {
  createImport,
  getImports,
  getImportById,
  generateImportReport
};
