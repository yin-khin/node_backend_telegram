// controllers/SetupController.js
const db = require('../models');
const Role = db.Role;
const Permission = db.Permission;
const RolePermission = db.RolePermission;
const sequelize = db.sequelize;

// Initialize roles and permissions (run seeder)
const initializeRolesAndPermissions = async (req, res) => {
  try {
    // Check if roles already exist
    const existingRoles = await Role.count();
    if (existingRoles > 0) {
      return res.status(400).json({
        success: false,
        message: "Roles and permissions already initialized. Use /api/setup/reset to reset them.",
      });
    }

    // Import and run the seeder
    const seeder = require("../seeders/permissions");
    const queryInterface = sequelize.getQueryInterface();
    
    await seeder.up(queryInterface, sequelize);

    res.status(200).json({
      success: true,
      message: "Roles and permissions initialized successfully",
      roles: ["ADMIN", "MANAGER", "INVENTORY", "SALE", "CASHIER", "USER"],
    });
  } catch (error) {
    console.error("Error initializing roles and permissions:", error);
    res.status(500).json({
      success: false,
      message: "Error initializing roles and permissions",
      error: error.message,
    });
  }
};

// Create USER role if it doesn't exist (quick fix)
const ensureUserRole = async (req, res) => {
  try {
    let userRole = await Role.findOne({ where: { name: 'USER' } });
    
    if (!userRole) {
      userRole = await Role.create({
        name: 'USER',
        description: 'Normal user with view-only access'
      });
      
      // Get basic permissions for USER role
      const basicPermissions = await Permission.findAll({
        where: {
          name: [
            'view_dashboard',
            'view_product',
            'view_category',
            'view_brand',
            'view_supplier',
            'view_sale',
            'view_sale_item',
            'view_customer',
            'view_purchase',
            'view_purchase_item',
            'view_notification',
            'mark_read_notification',
          ]
        }
      });

      // Assign permissions to USER role
      if (basicPermissions.length > 0) {
        await Promise.all(
          basicPermissions.map(permission =>
            RolePermission.create({
              role_id: userRole.id,
              permission_id: permission.id,
            })
          )
        );
      }

      return res.status(201).json({
        success: true,
        message: "USER role created successfully",
        role: userRole,
      });
    }

    res.status(200).json({
      success: true,
      message: "USER role already exists",
      role: userRole,
    });
  } catch (error) {
    console.error("Error ensuring USER role:", error);
    res.status(500).json({
      success: false,
      message: "Error creating USER role",
      error: error.message,
    });
  }
};

// Fix USER role permissions (remove create/edit/delete, keep only view)
const fixUserRolePermissions = async (req, res) => {
  try {
    const userRole = await Role.findOne({ 
      where: { name: 'USER' }
    });
    
    if (!userRole) {
      return res.status(404).json({
        success: false,
        message: "USER role not found"
      });
    }
    
    // Get current permissions using the association
    const currentPermissions = await userRole.getPermissions();
    
    // Define correct permissions (VIEW ONLY)
    const correctPermissionNames = [
      'view_dashboard',
      'view_product',
      'view_category',
      'view_brand',
      'view_supplier',
      'view_sale',
      'view_sale_item',
      'view_customer',
      'view_purchase',
      'view_purchase_item',
      'view_notification',
      'mark_read_notification',
    ];

    // Get correct permissions from database
    const correctPermissions = await Permission.findAll({
      where: { name: correctPermissionNames }
    });

    // Remove all existing permissions
    await userRole.setPermissions([]);

    // Add only view permissions
    await userRole.setPermissions(correctPermissions);

    // Get updated permissions
    const updatedPermissions = await userRole.getPermissions();
    const permissionNames = updatedPermissions.map(p => p.name);

    res.status(200).json({
      success: true,
      message: "USER role permissions fixed successfully",
      removedPermissions: currentPermissions
        .filter(p => !correctPermissionNames.includes(p.name))
        .map(p => p.name),
      currentPermissions: permissionNames,
      note: "USER role now has VIEW ONLY permissions (no create, edit, delete, or update)"
    });
  } catch (error) {
    console.error("Error fixing USER role permissions:", error);
    res.status(500).json({
      success: false,
      message: "Error fixing USER role permissions",
      error: error.message,
    });
  }
};

// Get setup status
const getSetupStatus = async (req, res) => {
  try {
    const roleCount = await Role.count();
    const permissionCount = await Permission.count();
    const userRole = await Role.findOne({ 
      where: { name: 'USER' }
    });

    // Check if USER role has incorrect permissions
    let hasIncorrectPermissions = false;
    let userPermissions = [];
    
    if (userRole) {
      const permissions = await userRole.getPermissions();
      userPermissions = permissions.map(p => p.name);
      // Check for any create, edit, delete, or update permissions
      hasIncorrectPermissions = userPermissions.some(perm => 
        perm.includes('create_') || 
        perm.includes('edit_') || 
        perm.includes('delete_') || 
        perm.includes('update_')
      );
    }

    res.status(200).json({
      success: true,
      initialized: roleCount > 0,
      roleCount,
      permissionCount,
      userRoleExists: !!userRole,
      userRolePermissions: userPermissions,
      hasIncorrectPermissions,
      message: roleCount > 0 
        ? (hasIncorrectPermissions 
          ? "System is initialized but USER role has incorrect permissions. Call /api/setup/fix-user-permissions to fix."
          : "System is initialized")
        : "System needs initialization. Call /api/setup/init to initialize.",
    });
  } catch (error) {
    console.error("Error getting setup status:", error);
    res.status(500).json({
      success: false,
      message: "Error getting setup status",
      error: error.message,
    });
  }
};

module.exports = {
  initializeRolesAndPermissions,
  ensureUserRole,
  getSetupStatus,
  fixUserRolePermissions,
};
