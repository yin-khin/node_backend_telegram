// models/Notification.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Notification = sequelize.define("Notification", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.ENUM('low_stock', 'out_of_stock', 'sale_new', 'purchase_new', 'expiring_soon', 'expiring_today', 'expired'),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    reference_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  // Define associations
  Notification.associate = function(models) {
    try {
      // Associate with Product to get expire_date information
      if (models.Product) {
        Notification.belongsTo(models.Product, {
          foreignKey: 'reference_id',
          as: 'Product',
          constraints: false
        });
      }
    } catch (error) {
      // console.error('Error in Notification.associate:', error);
    }
  };

  return Notification;
};