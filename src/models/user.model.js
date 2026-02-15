// src/models/user.model.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      // first_name: {
      //   type: DataTypes.STRING(50),
      //   allowNull: false,
      // },
      // last_name: {
      //   type: DataTypes.STRING(50),
      //   allowNull: false,
      // },
      photo: {
        type: DataTypes.TEXT('long'), // Use LONGTEXT for large base64 images
        allowNull: true,
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id',
        },
      },
      status: {
        type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
        defaultValue: "ACTIVE",
      },
    },
    {
      tableName: "users",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  // Define associations after module exports to avoid circular dependency
  User.associate = function(models) {
    try {
      if (models.Role) {
        User.belongsTo(models.Role, { foreignKey: "role_id", as: "Role" });
      }
    } catch (error) {
      // console.error('Error in User.associate:', error);
    }
  };

  return User;
};