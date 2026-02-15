const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const RolePermission = sequelize.define(
    "RolePermission",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id',
        },
      },
      permission_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'permissions',
          key: 'id',
        },
      },
    },
    {
      tableName: 'role_permissions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['role_id', 'permission_id']
        }
      ]
    }
  );

  // Define associations after module exports to avoid circular dependency
  RolePermission.associate = function(models) {
    try {
      // Junction table doesn't need explicit associations
      // They are handled through belongsToMany relationships
    } catch (error) {
      // console.error('Error in RolePermission.associate:', error);
    }
  };

  return RolePermission;
};