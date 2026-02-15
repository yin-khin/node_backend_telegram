const db = require('../models');
const Product = db.Product;
const Purchase = db.Purchase;
const PurchaseItem = db.PurchaseItem;
const NotificationService = require('../services/notificationService');


const getPurchaseItem = async (req, res) => {
  try {
    const purchaseItems = await PurchaseItem.findAll({
      include: [
        { model: Purchase, as: "Purchase" }, 
        { model: Product, as: "Product" }, 
      ],
      order: [["id", "ASC"]], 
    });

    // Date formatting helper
    const formatDate = (date) => {
      if (!date) return null;
      return new Date(date).toISOString().slice(0, 10); 
    };

    // Format dates for each item
    const formattedItems = purchaseItems.map((item) => {
      const plainItem = item.get({ plain: true }); 

      return {
        ...plainItem,
        manufacture_date: formatDate(plainItem.manufacture_date),
        expire_date: formatDate(plainItem.expire_date),
      };
    });

    res.status(200).json({
      message: "show purchaseItem all",
      count: formattedItems.length,
      purchaseItems: formattedItems, // plural name for clarity
    });
  } catch (e) {
    console.error("Error fetching purchase items:", e);
    res.status(500).json({
      message: "error purchaseItem",
      error: e.message,
    });
  }
};
const getById= async(req,res)=>{
  const {id}=req.params;
  try{
    const purchaseItem = await PurchaseItem.findByPk(id,{
      include:[{model:Purchase, as: "Purchase"},{model:Product, as: "Product"}]
    });
    res.status(200).json({
      message:"find purchase item success",
      purchaseItem,
    })
  }catch(e){
    res.status(500).json({
      message:"error purchase item",error:e.message,
    })
  }
}
const createPurchaseItem = async (req, res) => {
  try {
    const {
      purchase_id,
      product_id,
      qty,
      cost_price,
      sale_price,
      manufacture_date,
      expire_date,
    } = req.body;
    
    // Create the purchase item
    const newPurchaseItem = await PurchaseItem.create({
      purchase_id,
      product_id,
      qty,
      cost_price,
      sale_price,
      manufacture_date,
      expire_date,
    });

    // Update product quantity - ADD the purchased quantity to existing stock
    await Product.increment('qty', {
      by: parseInt(qty),
      where: { id: product_id }
    });

    // Also update the product's price if needed
    await Product.update({
      price: cost_price,
      sale_price: sale_price
    }, {
      where: { id: product_id }
    });

    // Check stock levels and create notifications after quantity update
    try {
      await NotificationService.checkProductStockLevel(product_id);
    } catch (notificationError) {
      console.error('Error checking stock levels after purchase item creation:', notificationError);
      // Don't fail the purchase item creation if notification fails
    }

    //form date to YYYY-MM-DD
    const formatDate= (isString)=>{
      if(!isString)return null;
      return new Date(isString).toISOString().slice(0,10);
    }

    const formattedItem = {
      ...newPurchaseItem.dataValues,
      manufacture_date:formatDate(newPurchaseItem.manufacture_date),
      expire_date:formatDate(newPurchaseItem.expire_date),
    }
    res.status(200).json({
      message: "create purchaseItem successful - product quantity updated",
      newPurchaseItem:formattedItem,
    });
  } catch (e) {
    res.status(500).json({
      message: "error purchaseItem",
      error: e.message,
    });
  }
};

const updatePurchaseItem = async (req, res) => {
  const { id } = req.params;
  const {
    purchase_id,
    product_id,
    qty,
    cost_price,
    sale_price,
    manufacture_date,
    expire_date,
  } = req.body;

  try {
    const purchaseItem = await PurchaseItem.findByPk(id);
    if (!purchaseItem) {
      return res.status(404).json({
        message: "Purchase item not found"
      });
    }
    
    // Get old values before update
    const oldQty = purchaseItem.qty;
    const oldProductId = purchaseItem.product_id;
    
    // Update the purchase item
    await purchaseItem.update({
      purchase_id,
      product_id,
      qty,
      cost_price,
      sale_price,
      manufacture_date,
      expire_date,
    });
    
    // Update product quantities
    if (oldProductId === product_id) {
      // Same product - adjust quantity by difference
      const qtyDifference = parseInt(qty) - parseInt(oldQty);
      if (qtyDifference !== 0) {
        await Product.increment('qty', {
          by: qtyDifference,
          where: { id: product_id }
        });
      }
    } else {
      // Different product - subtract from old, add to new
      await Product.decrement('qty', {
        by: parseInt(oldQty),
        where: { id: oldProductId }
      });
      await Product.increment('qty', {
        by: parseInt(qty),
        where: { id: product_id }
      });
    }

    // Update product prices
    await Product.update({
      price: cost_price,
      sale_price: sale_price
    }, {
      where: { id: product_id }
    });

    // Check stock levels and create notifications after quantity update
    try {
      await NotificationService.checkProductStockLevel(product_id);
    } catch (notificationError) {
      console.error('Error checking stock levels after purchase item update:', notificationError);
      // Don't fail the purchase item update if notification fails
    }
    
    // Date formatting helper
    const formatDate = (date) => {
      if (!date) return null;
      return new Date(date).toISOString().slice(0, 10);
    };
    
    const formattedItem = {
      ...purchaseItem.dataValues,
      manufacture_date: formatDate(purchaseItem.manufacture_date),
      expire_date: formatDate(purchaseItem.expire_date),
    };
    
    res.status(200).json({
      message: "update purchase items success - product quantity updated",
      purchaseItem: formattedItem,
    });
  } catch (e) {
    res.status(500).json({
        message:"error purchase items",error:e.message,
    });
  }
};


const deletePurchaseItem = async (req, res) => {
  const {id}=req.params;
  try{
    const purchaseItem = await PurchaseItem.findByPk(id);
    if (!purchaseItem) {
      return res.status(404).json({
        message: "Purchase item not found"
      });
    }
    
    // Get values before deletion
    const qty = purchaseItem.qty;
    const product_id = purchaseItem.product_id;
    
    // Subtract the quantity from product stock before deleting
    await Product.decrement('qty', {
      by: parseInt(qty),
      where: { id: product_id }
    });
    
    // Check stock levels and create notifications after quantity update
    try {
      await NotificationService.checkProductStockLevel(product_id);
    } catch (notificationError) {
      console.error('Error checking stock levels after purchase item deletion:', notificationError);
      // Don't fail the deletion if notification fails
    }

    await purchaseItem.destroy();
    
    // Date formatting helper
    const formatDate = (date) => {
      if (!date) return null;
      return new Date(date).toISOString().slice(0, 10);
    };
    
    const formattedItem = {
      ...purchaseItem.dataValues,
      manufacture_date: formatDate(purchaseItem.manufacture_date),
      expire_date: formatDate(purchaseItem.expire_date),
    };
    
    res.status(200).json({
      message:"delete purchase item successful - product quantity updated",
      purchaseItem: formattedItem,
    });
  }catch(e){
    res.status(500).json({
      message:"error purchase item",error:e.message
    })
  }
};
module.exports = {
  getPurchaseItem,
  getById,
  createPurchaseItem,
  updatePurchaseItem,
  deletePurchaseItem,

};
