const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Category = sequelize.define(
    "Category",
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
        defaultValue: 0,
        allowNull: true,
      },
    },
    {
      tableName: "categories",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    });

  // Define associations
  Category.associate = function(models) {
    try {
      if (models.Product) {
        Category.hasMany(models.Product, { foreignKey: "category_id" });
      }
    } catch (error) {
      console.error('Error in Category.associate:', error);
    }
  };

  return Category;
};
