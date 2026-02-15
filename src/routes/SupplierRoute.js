var {
  getAllSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierById,
} = require("../controllers/SupplierController");
const auth = require("../middlewares/auth.middleware")
const supplier = (app) => {
  app.get("/api/supplier",auth.validate_token(), getAllSupplier);
  app.get("/api/supplier/:id",auth.validate_token(),getSupplierById);
  app.post("/api/supplier",auth.validate_token(), createSupplier);
  app.put("/api/supplier/:id",auth.validate_token(), updateSupplier);
  app.delete("/api/supplier/:id", auth.validate_token(),deleteSupplier);
};
module.exports = supplier;
