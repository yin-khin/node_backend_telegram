const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Sale = sequelize.define(
    "Sale",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id',
        },
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      discount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00,
      },
      paid: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      balance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      sale_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "sales",
      timestamps: false,
    }
  );

  // Define associations
  Sale.associate = function(models) {
    try {
      if (models.Customer) {
        Sale.belongsTo(models.Customer, { 
          foreignKey: "customer_id",
          as: "Customer"
        });
      }
      if (models.SaleItem) {
        Sale.hasMany(models.SaleItem, { 
          foreignKey: "sale_id",
          as: "SaleItems"
        });
      }
      if (models.Payment) {
        Sale.hasMany(models.Payment, { 
          foreignKey: "sale_id",
          as: "Payments"
        });
      }
    } catch (error) {
      console.error('Error in Sale.associate:', error);
    }
  };

  return Sale;
};