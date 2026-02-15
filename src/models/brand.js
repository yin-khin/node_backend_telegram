const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Brand = sequelize.define(
    "Brand",
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
      image: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
    },
    {
      tableName: "brands",
      timestamps: true,
      createdAt: "create_at",
      updatedAt: false,
    }
  );

  // Define associations
  Brand.associate = function(models) {
    try {
      if (models.Product) {
        Brand.hasMany(models.Product, { foreignKey: "brand_id" });
      }
    } catch (error) {
      console.error('Error in Brand.associate:', error);
    }
  };

  return Brand;
};
