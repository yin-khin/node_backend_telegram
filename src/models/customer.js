// models/Customer.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Customer = sequelize.define(
    "Customer",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "customers",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false, // No updated_at column in the table
    }
  );

  // Define associations
  Customer.associate = function (models) {
    try {
      if (models.Sale) {
        Customer.hasMany(models.Sale, { foreignKey: "customer_id" });
      }
    } catch (error) {
      // console.error("Error in Customer.associate:", error);
    }
  };

  return Customer;
};
