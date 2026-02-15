// models/SaleItem.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const SaleItem = sequelize.define(
    "SaleItem",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      sale_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'sales',
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
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      unit_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      tableName: "sale_items",
      timestamps: false,
    }
  );

  // Define associations
  SaleItem.associate = function(models) {
    try {
      if (models.Sale) {
        SaleItem.belongsTo(models.Sale, { 
          foreignKey: "sale_id",
          as: "Sale"
        });
      }
      if (models.Product) {
        SaleItem.belongsTo(models.Product, { 
          foreignKey: "product_id",
          as: "Product"
        });
      }
    } catch (error) {
      // console.error('Error in SaleItem.associate:', error);
    }
  };

  return SaleItem;
};
