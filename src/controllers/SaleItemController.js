const db = require('../models');
const Product = db.Product;
const SaleItems = db.SaleItem;
const Sales = db.Sales;
const sequelize = db.sequelize;
const NotificationService = require('../services/notificationService');

// Get all sale items
const getSaleItemAll = async (req, res) => {
  try {
    const saleItems = await SaleItems.findAll({
      include: [
        {
          model: Product,
          as: "Product",
          attributes: ['id', 'name', 'barcode', 'qty', 'sale_price']
        },
        {
          model: Sales,
          as: "Sale",
          attributes: ['id', 'total', 'sale_date', 'customer_id']
        },
      ],
      order: [['id', 'DESC']]
    });
    res.status(200).json({
      success: true,
      message: "Sale items retrieved successfully",
      count: saleItems.length,
      data: saleItems,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Error retrieving sale items",
      error: e.message,
    });
  }
};

// Get sale item by ID
const getSaleItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const saleItem = await SaleItems.findByPk(id, {
      include: [
        {
          model: Product,
          as: "Product",
          attributes: ['id', 'name', 'barcode', 'qty', 'sale_price', 'category_id', 'brand_id']
        },
        {
          model: Sales,
          as: "Sale",
          include: [{
            model: db.Customer,
            as: "Customer"
          }]
        },
      ]
    });

    if (!saleItem) {
      return res.status(404).json({
        success: false,
        message: "Sale item not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Sale item retrieved successfully",
      data: saleItem,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Error retrieving sale item",
      error: e.message,
    });
  }
};

// Get sale items by sale ID
const getSaleItemsBySaleId = async (req, res) => {
  try {
    const { saleId } = req.params;
    const saleItems = await SaleItems.findAll({
      where: { sale_id: saleId },
      include: [
        {
          model: Product,
          as: "Product",
          attributes: ['id', 'name', 'barcode', 'qty', 'sale_price']
        },
        {
          model: Sales,
          as: "Sale",
          attributes: ['id', 'total', 'sale_date']
        },
      ],
      order: [['id', 'ASC']]
    });

    res.status(200).json({
      success: true,
      message: "Sale items retrieved successfully",
      count: saleItems.length,
      data: saleItems,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Error retrieving sale items",
      error: e.message,
    });
  }
};

// Create new sale item
const createSaleItem = async (req, res) => {
  try {
    const { sale_id, product_id, quantity, unit_price } = req.body;

    // Validate required fields
    if (!sale_id || !product_id || !quantity || !unit_price) {
      return res.status(400).json({
        success: false,
        message: "sale_id, product_id, quantity, and unit_price are required",
      });
    }

    // Validate sale exists
    const sale = await Sales.findByPk(sale_id);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    // Validate product exists and check stock
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check stock availability
    const currentQty = product.qty || 0;
    if (currentQty < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for product ${product.name}. Available: ${currentQty}, Requested: ${quantity}`,
      });
    }

    // Start transaction
    const result = await sequelize.transaction(async (t) => {
      // Create sale item
      const saleItem = await SaleItems.create({
        sale_id,
        product_id,
        quantity,
        unit_price
      }, { transaction: t });

      // Update product stock (decrease qty)
      const newQty = currentQty - quantity;
      await product.update({
        qty: newQty
      }, { transaction: t });

      // Check stock levels and create notifications after quantity update
      try {
        await NotificationService.checkProductStockLevel(product.id);
      } catch (notificationError) {
        console.error('Error checking stock levels after sale item creation:', notificationError);
        // Don't fail the sale item creation if notification fails
      }

      // Update sale total
      const itemTotal = quantity * unit_price;
      const newSaleTotal = parseFloat(sale.total) + itemTotal;
      const newSaleBalance = newSaleTotal - sale.discount - sale.paid;
      await sale.update({
        total: newSaleTotal,
        balance: newSaleBalance
      }, { transaction: t });

      return saleItem;
    });

    // Fetch complete sale item with associations
    const completeSaleItem = await SaleItems.findByPk(result.id, {
      include: [
        {
          model: Product,
          as: "Product"
        },
        {
          model: Sales,
          as: "Sale"
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: "Sale item created successfully",
      data: completeSaleItem,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Error creating sale item",
      error: e.message,
    });
  }
};

// Update sale item
const updateSaleItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, unit_price } = req.body;

    const saleItem = await SaleItems.findByPk(id, {
      include: [
        {
          model: Product,
          as: "Product"
        },
        {
          model: Sales,
          as: "Sale"
        }
      ]
    });

    if (!saleItem) {
      return res.status(404).json({
        success: false,
        message: "Sale item not found",
      });
    }

    const oldQuantity = saleItem.quantity;
    const oldUnitPrice = saleItem.unit_price;
    const newQuantity = quantity !== undefined ? quantity : oldQuantity;
    const newUnitPrice = unit_price !== undefined ? unit_price : oldUnitPrice;

    // Start transaction
    await sequelize.transaction(async (t) => {
      // If quantity changed, update product stock
      if (quantity !== undefined && quantity !== oldQuantity) {
        const product = await Product.findByPk(saleItem.product_id, { transaction: t });
        if (product) {
          const quantityDiff = quantity - oldQuantity;
          const currentQty = product.qty || 0;
          
          if (quantityDiff > 0) {
            // Quantity increased - check stock
            if (currentQty < quantityDiff) {
              throw new Error(`Insufficient stock. Available: ${currentQty}, Needed: ${quantityDiff}`);
            }
            product.qty = currentQty - quantityDiff;
          } else {
            // Quantity decreased - restore stock
            product.qty = currentQty + Math.abs(quantityDiff);
          }
          
          await product.save({ transaction: t });

          // Check stock levels and create notifications after quantity update
          try {
            await NotificationService.checkProductStockLevel(product.id);
          } catch (notificationError) {
            console.error('Error checking stock levels after sale item update:', notificationError);
            // Don't fail the sale item update if notification fails
          }
        }
      }

      // Update sale item
      await saleItem.update({
        quantity: newQuantity,
        unit_price: newUnitPrice
      }, { transaction: t });

      // Update sale total
      const sale = await Sales.findByPk(saleItem.sale_id, { transaction: t });
      if (sale) {
        const oldItemTotal = oldQuantity * oldUnitPrice;
        const newItemTotal = newQuantity * newUnitPrice;
        const totalDiff = newItemTotal - oldItemTotal;
        const newSaleTotal = parseFloat(sale.total) + totalDiff;
        const newSaleBalance = newSaleTotal - sale.discount - sale.paid;
        
        await sale.update({
          total: newSaleTotal,
          balance: newSaleBalance
        }, { transaction: t });
      }
    });

    // Fetch updated sale item
    const updatedSaleItem = await SaleItems.findByPk(id, {
      include: [
        {
          model: Product,
          as: "Product"
        },
        {
          model: Sales,
          as: "Sale"
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: "Sale item updated successfully",
      data: updatedSaleItem,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Error updating sale item",
      error: e.message,
    });
  }
};

// Delete sale item
const deleteSaleItem = async (req, res) => {
  try {
    const { id } = req.params;

    const saleItem = await SaleItems.findByPk(id, {
      include: [
        {
          model: Product,
          as: "Product"
        },
        {
          model: Sales,
          as: "Sale"
        }
      ]
    });

    if (!saleItem) {
      return res.status(404).json({
        success: false,
        message: "Sale item not found",
      });
    }

    // Start transaction
    await sequelize.transaction(async (t) => {
      // Restore product stock
      const product = await Product.findByPk(saleItem.product_id, { transaction: t });
      if (product) {
        const newQty = (product.qty || 0) + saleItem.quantity;
        await product.update({
          qty: newQty
        }, { transaction: t });

        // Check stock levels and create notifications after quantity restoration
        try {
          await NotificationService.checkProductStockLevel(product.id);
        } catch (notificationError) {
          console.error('Error checking stock levels after sale item deletion:', notificationError);
          // Don't fail the deletion if notification fails
        }
      }

      // Update sale total
      const sale = await Sales.findByPk(saleItem.sale_id, { transaction: t });
      if (sale) {
        const itemTotal = saleItem.quantity * saleItem.unit_price;
        const newSaleTotal = parseFloat(sale.total) - itemTotal;
        const newSaleBalance = newSaleTotal - sale.discount - sale.paid;
        
        await sale.update({
          total: newSaleTotal,
          balance: newSaleBalance
        }, { transaction: t });
      }

      // Delete sale item
      await saleItem.destroy({ transaction: t });
    });

    res.status(200).json({
      success: true,
      message: "Sale item deleted successfully",
      data: { id: parseInt(id) },
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Error deleting sale item",
      error: e.message,
    });
  }
};

module.exports = {
  getSaleItemAll,
  getSaleItemById,
  getSaleItemsBySaleId,
  createSaleItem,
  updateSaleItem,
  deleteSaleItem,
};