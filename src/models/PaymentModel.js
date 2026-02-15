const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Payment = sequelize.define(
    "Payment",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      sale_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'sales',
          key: 'id',
        },
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      method: {
        type: DataTypes.ENUM('cash', 'credit_card', 'bank_transfer'),
        allowNull: false,
      },
    },
    {
      tableName: "payments",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    }
  );

  // Define associations
  Payment.associate = function(models) {
    try {
      if (models.Sale) {
        Payment.belongsTo(models.Sale, { 
          foreignKey: "sale_id",
          as: "Sale"
        });
      }
    } catch (error) {
      // console.error('Error in Payment.associate:', error);
    }
  };

  return Payment;
};
