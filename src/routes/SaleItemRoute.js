const { 
  getSaleItemAll, 
  getSaleItemById, 
  getSaleItemsBySaleId,
  createSaleItem, 
  updateSaleItem, 
  deleteSaleItem 
} = require("../controllers/SaleItemController");
const auth= require("../middlewares/auth.middleware")
const SaleItem = (app) => {
  // Get all sale items
  app.get("/api/saleItems", auth.validate_token(),getSaleItemAll);
  
  // Get sale items by sale ID
  app.get("/api/saleItems/sale/:saleId", auth.validate_token(),getSaleItemsBySaleId);
  
  // Get sale item by ID
  app.get("/api/saleItems/:id", auth.validate_token(),getSaleItemById);
  
  // Create new sale item
  app.post("/api/saleItems", auth.validate_token(),createSaleItem);
  
  // Update sale item
  app.put("/api/saleItems/:id", auth.validate_token(),updateSaleItem);
  
  // Delete sale item
  app.delete("/api/saleItems/:id", auth.validate_token(),deleteSaleItem);
};

module.exports = SaleItem;
