const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Product = sequelize.define(
    "Product",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(225),
        allowNull: false,
      },
      category_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'categories',
          key: "id",
        },
        allowNull: false,
      },
      brand_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'brands',
          key: "id",
        },
        allowNull: false,
      },
      supplier_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'supplier',
          key: "id",
        },
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      sale_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      barcode: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      image: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      expire_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "products",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    }
  );

  // Define associations
  Product.associate = function(models) {
    try {
      if (models.Category) {
        Product.belongsTo(models.Category, { 
          foreignKey: "category_id",
          as: "Category"
        });
      }
      if (models.Brand) {
        Product.belongsTo(models.Brand, { 
          foreignKey: "brand_id",
          as: "Brand"
        });
      }
      if (models.Supplier) {
        Product.belongsTo(models.Supplier, { 
          foreignKey: "supplier_id",
          as: "Supplier"
        });
      }
      if (models.PurchaseItem) {
        Product.hasMany(models.PurchaseItem, { 
          foreignKey: "product_id",
          as: "PurchaseItems"
        });
      }
      if (models.SaleItem) {
        Product.hasMany(models.SaleItem, { 
          foreignKey: "product_id",
          as: "SaleItems"
        });
      }
    } catch (error) {
      // console.error('Error in Product.associate:', error);
    }
  };

  return Product;
};
