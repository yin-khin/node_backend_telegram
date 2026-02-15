const { 
  getSales, 
  getSaleById, 
  createSale, 
  updateSale, 
  deleteSale 
} = require("../controllers/SaleController");
const auth = require("../middlewares/auth.middleware")
const Sales = (app) => {
  // Get all sales
  app.get("/api/sales",auth.validate_token(), getSales);
  
  // Get sale by ID
  app.get("/api/sales/:id",auth.validate_token(), getSaleById);
  
  // Create new sale
  app.post("/api/sales", auth.validate_token(),createSale);
  
  // Update sale
  app.put("/api/sales/:id",auth.validate_token(), updateSale);
  
  // Delete sale
  app.delete("/api/sales/:id",auth.validate_token(), deleteSale);
};

module.exports = Sales;;