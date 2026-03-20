var {
  getAllProduct,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
// const auth = require("../middlewares/auth.middleware");
const product = (app) => {
  app.get("/api/products",getAllProduct);
  app.get("/api/products/:id", getProductById);
  app.post("/api/products", createProduct);
  app.put("/api/products/:id", updateProduct);
  app.delete("/api/products/:id", deleteProduct);
};

module.exports = product;
