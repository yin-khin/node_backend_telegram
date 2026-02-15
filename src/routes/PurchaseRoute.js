var {
  getAllPurchase,
  createPurchase,
  updatePurchase,
  deletePurchase,
  getByIDPurchase,
} = require("../controllers/PurchaseController");
const auth = require("../middlewares/auth.middleware");
const purchase = (app) => {
  app.get("/api/purchase", auth.validate_token(),getAllPurchase);
  app.get("/api/purchase/:id", auth.validate_token(),getByIDPurchase);
  app.post("/api/purchase", auth.validate_token(),createPurchase);
  app.put("/api/purchase/:id", auth.validate_token(),updatePurchase);
  app.delete("/api/purchase/:id", auth.validate_token(),deletePurchase);
};
module.exports = purchase;
