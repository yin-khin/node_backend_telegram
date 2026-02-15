// sync.js
const sequelize = require("./src/config/db");
const Customer = require("./src/models/customer");
const Category = require("./src/models/category");
const Brand = require("./src/models/brand");
const Product = require("./src/models/Product");
const Supplier = require("./src/models/supplierModel");
const Purchase = require("./src/models/Purchase");
const PurchaseItem = require("./src/models/PurchaseItem");
const Sales = require("./src/models/SalesModel");
const SaleItem = require("./src/models/SaleItemModel");
const Payment = require("./src/models/PaymentModel");
const User = require("./src/models/user.model");
const Role = require("./src/models/role.model");
const Permissions = require("./src/models/permission.model");
const Staff = require("./src/models/StaffModel");
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");

    await sequelize.sync({ force: true }); // Use force: true to drop the table if it exists and recreate it
    console.log("All models were synchronized successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  } finally {
    await sequelize.close();
  }
};

syncDatabase();
