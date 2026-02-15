var {
  getAllProduct,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const auth = require("../middlewares/auth.middleware");
const product = (app) => {
  app.get("/api/products", auth.validate_token(),getAllProduct);
  app.get("/api/products/:id", auth.validate_token(),getProductById);
  app.post("/api/products", auth.validate_token(),createProduct);
  app.put("/api/products/:id", auth.validate_token(),updateProduct);
  app.delete("/api/products/:id", auth.validate_token(),deleteProduct);
};

module.exports = product;
