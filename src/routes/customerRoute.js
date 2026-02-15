var {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customerController");
const auth = require('../middlewares/auth.middleware');
const customers = (app) => {
  app.get("/api/customers", auth.validate_token(), getAllCustomers);
  app.get("/api/customers/:id", auth.validate_token(),getCustomerById);
  app.post("/api/customers", auth.validate_token(),createCustomer);
  app.put("/api/customers/:id", auth.validate_token(),updateCustomer);
  app.delete("/api/customers/:id",auth.validate_token(),deleteCustomer);
};
module.exports = customers;
