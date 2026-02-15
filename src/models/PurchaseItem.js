// models/PurchaseItem.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PurchaseItem = sequelize.define(
    "PurchaseItem",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      purchase_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'purchases',
          key: 'id',
        },
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
      },
      qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      cost_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      sale_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      manufacture_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      expire_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "purchase_items",
      timestamps: false,
    }
  );

  // Define associations
  PurchaseItem.associate = function(models) {
    try {
      if (models.Purchase) {
        PurchaseItem.belongsTo(models.Purchase, { 
          foreignKey: "purchase_id",
          as: "Purchase"
        });
      }
      if (models.Product) {
        PurchaseItem.belongsTo(models.Product, { 
          foreignKey: "product_id",
          as: "Product"
        });
      }
    } catch (error) {
      // console.error('Error in PurchaseItem.associate:', error);
    }
  };

  return PurchaseItem;
};
