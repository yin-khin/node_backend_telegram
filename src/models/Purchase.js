const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Purchase = sequelize.define(
    "Purchase",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      supplier_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'supplier',
          key: 'id',
        },
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      paid: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      balance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      tableName: "purchases",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    }
  );

  // Define associations
  Purchase.associate = function(models) {
    try {
      if (models.Supplier) {
        Purchase.belongsTo(models.Supplier, { 
          foreignKey: "supplier_id",
          as: "Supplier"
        });
      }
      if (models.PurchaseItem) {
        Purchase.hasMany(models.PurchaseItem, { 
          foreignKey: "purchase_id",
          as: "PurchaseItems"
        });
      }
    } catch (error) {
      // console.error('Error in Purchase.associate:', error);
    }
  };

  return Purchase;
};
