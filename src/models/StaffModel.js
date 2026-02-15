// models/Staff.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Staff = sequelize.define("Staff", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    staff_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dob: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM("Male", "Female", "Other"),
      allowNull: false,
    },
    phone: {
       type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "roles",
        key: "id",
      },
    },
    photo: {
      type: DataTypes.TEXT('long'), // LONGTEXT for MySQL
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1, // 1 = active, 0 = inactive
    },
  }, {
    tableName: "staffs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false, // Disable updatedAt since table doesn't have this column
  });

  Staff.associate = function(models) {
    try {
      if (models.Role) {
        Staff.belongsTo(models.Role, { foreignKey: "role_id", as: "Role" });
      }
    } catch (error) {
      console.error('Error in Staff.associate:', error);
    }
  };

  return Staff;
};
