const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Role = sequelize.define(
    "Role",
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
    },
    {
      tableName: "roles",
      timestamps: false,
    }
  );

  // Define associations after module exports to avoid circular dependency
  Role.associate = function(models) {
    try {
      if (models.User) {
        Role.hasMany(models.User, { foreignKey: "role_id" });
      }
      
      // Set up permission associations only if required models exist
      if (models.Permission && models.RolePermission) {
        Role.belongsToMany(models.Permission, {
          through: models.RolePermission,
          foreignKey: "role_id",
          otherKey: "permission_id",
        });
        
        models.Permission.belongsToMany(Role, {
          through: models.RolePermission,
          foreignKey: "permission_id",
          otherKey: "role_id",
        });
      }
    } catch (error) {
      // console.error('Error in Role.associate:', error);
    }
  };

  return Role;
};