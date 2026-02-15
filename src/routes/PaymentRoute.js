const { 
  getPayments, 
  getPaymentById, 
  createPayment, 
  updatePayment, 
  deletePayment 
} = require("../controllers/paymentController");
const auth = require("../middlewares/auth.middleware");
const PaymentRoutes = (app) => {
  // Get all payments
  app.get("/api/payments", auth.validate_token(),getPayments);
  
  // Get payment by ID
  app.get("/api/payments/:id", auth.validate_token(),getPaymentById);
  
  // Create new payment
  app.post("/api/payments", auth.validate_token(),createPayment);
  
  // Update payment
  app.put("/api/payments/:id", auth.validate_token(),updatePayment);
  
  // Delete payment
  app.delete("/api/payments/:id", auth.validate_token(),deletePayment);
};

module.exports = PaymentRoutes;