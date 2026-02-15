// const { DataTypes } = require("sequelize");

// module.exports = (sequelize) => {
//   const Supplier = sequelize.define(
//     "Supplier",
//     {
//       id: {
//         type: DataTypes.INTEGER,
//         primaryKey: true,
//         autoIncrement: true,
//       },
//       name: {
//         type: DataTypes.STRING(20),
//         allowNull: false,
//       },
//       phone_first: {
//         type: DataTypes.STRING(20),
//         allowNull: true,
//       },
//       phone_second: {
//         type: DataTypes.STRING(20),
//         allowNull: true,
//       },
//       address: {
//         type: DataTypes.STRING(255),
//         allowNull: true,
//       },
//       telegram_chat_id: {
//         type: DataTypes.BIGINT,
//         allowNull: true,
//       },
//       status: {
//         type: DataTypes.STRING(20),
//         defaultValue: "active",
//       },
//     },
//     {
//       tableName: "supplier",
//       timestamps: true,
//       createdAt: "createdAt",
//       updatedAt: "updatedAt",
//     },
//   );

//   // Define associations
//   Supplier.associate = function (models) {
//     try {
//       if (models.Purchase) {
//         Supplier.hasMany(models.Purchase, { foreignKey: "supplier_id" });
//       }
//       if (models.Product) {
//         Supplier.hasMany(models.Product, {
//           foreignKey: "supplier_id",
//           as: "Products",
//         });
//       }
//     } catch (error) {
//       // console.error('Error in Supplier.associate:', error);
//     }
//   };

//   return Supplier;
// };

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Supplier = sequelize.define(
    "Supplier",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      phone_first: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      phone_second: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      address: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      telegram_chat_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(
          'active',      // Active and currently supplying
          'inactive',    // Temporarily not supplying
          'suspended',   // Suspended due to issues (late delivery, quality, etc.)
          'blocked',     // Blocked/blacklisted
          'pending',     // New supplier pending approval
          'archived'     // Old supplier no longer used
        ),
        defaultValue: "active",
        allowNull: false,
      },
    },
    {
      tableName: "supplier",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  );

  // Define associations
  Supplier.associate = function (models) {
    try {
      if (models.Purchase) {
        Supplier.hasMany(models.Purchase, { foreignKey: "supplier_id" });
      }
      if (models.Product) {
        Supplier.hasMany(models.Product, {
          foreignKey: "supplier_id",
          as: "Products",
        });
      }
    } catch (error) {
      // console.error('Error in Supplier.associate:', error);
    }
  };

  // Instance methods
  Supplier.prototype.isActive = function() {
    return this.status === 'active';
  };

  Supplier.prototype.canSupply = function() {
    return ['active', 'pending'].includes(this.status);
  };

  return Supplier;
};