const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Permission = sequelize.define(
    "Permission",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      module: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      action: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
    },
    {
      tableName: "permissions",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  // Define associations after module exports to avoid circular dependency
  Permission.associate = function(models) {
    try {
      // Associations are handled in role.model.js to avoid circular dependencies
      // No direct associations needed for Permission model
    } catch (error) {
      // console.error('Error in Permission.associate:', error);
    }
  };

  return Permission;
};
