const db = require('../models');
const { Op } = require('sequelize');

const Product = db.Product;
const Sales = db.Sale;
const SaleItem = db.SaleItem;
const Purchase = db.Purchase;
const Customer = db.Customer;

const getDashboardData = async (req, res) => {
  try {
    // Get total products count
    const totalProducts = await Product.count();

    // Get total sales count and total revenue
    const sales = await Sales.findAll({
      attributes: ['total', 'sale_date']
    });
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0);

    // Get total purchases count
    const totalPurchases = await Purchase.count();

    // Get total customers count
    const totalCustomers = await Customer.count();

    // Calculate total stock
    const products = await Product.findAll({
      attributes: ['qty']
    });
    const totalStock = products.reduce((sum, product) => sum + (product.qty || 0), 0);

    // Get product sales data
    const productSalesData = await SaleItem.findAll({
      attributes: [
        'product_id',
        [db.sequelize.fn('SUM', db.sequelize.col('quantity')), 'total_quantity_sold'],
        [db.sequelize.fn('COUNT', db.sequelize.col('SaleItem.id')), 'transaction_count']
      ],
      include: [{
        model: Product,
        as: 'Product',
        attributes: ['id', 'name', 'barcode']
      }],
      group: ['product_id', 'Product.id', 'Product.name', 'Product.barcode'],
      order: [[db.sequelize.col('total_quantity_sold'), 'DESC']],
      limit: 10
    });

    // Calculate average sales performance
    const salesNumbers = productSalesData.map(item => parseInt(item.dataValues.total_quantity_sold) || 0);
    const avgSales = salesNumbers.length > 0 ? salesNumbers.reduce((a, b) => a + b, 0) / salesNumbers.length : 0;

    // Categorize products based on sales performance
    const categorizedProducts = productSalesData.map(item => {
      const totalSold = parseInt(item.dataValues.total_quantity_sold) || 0;
      
      let performance = 'low'; // Default to low
      if (totalSold > avgSales * 1.3) {
        performance = 'high'; // 30% above average = high/best seller
      } else if (totalSold >= avgSales * 0.7) {
        performance = 'medium'; // Between 70-130% of average = medium
      } else {
        performance = 'low'; // Below 70% of average = low
      }
      
      return {
        productId: item.product_id,
        productName: item.Product?.name || 'Unknown Product',
        barcode: item.Product?.barcode || '',
        totalSales: totalSold,
        transactionCount: parseInt(item.dataValues.transaction_count),
        performance
      };
    });

    // Prepare response data
    const dashboardData = {
      stats: {
        totalProducts,
        totalSales,
        totalPurchases,
        totalCustomers,
        totalRevenue,
        totalStock
      },
      productSales: categorizedProducts
    };

    res.status(200).json({
      success: true,
      data: dashboardData,
      message: 'Dashboard data retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardData
};