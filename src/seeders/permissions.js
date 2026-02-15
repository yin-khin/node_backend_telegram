// src/seeders/permissions.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. First, create all roles
    await queryInterface.bulkInsert('roles', [
      { name: 'ADMIN', description: 'Administrator with full access', created_at: new Date(), updated_at: new Date() },
      { name: 'MANAGER', description: 'Manager with limited admin access', created_at: new Date(), updated_at: new Date() },
      { name: 'INVENTORY', description: 'Inventory management staff', created_at: new Date(), updated_at: new Date() },
      { name: 'SALE', description: 'Sales staff', created_at: new Date(), updated_at: new Date() },
      { name: 'CASHIER', description: 'Cashier with limited sales access', created_at: new Date(), updated_at: new Date() },
      { name: 'USER', description: 'Normal user with view-only access', created_at: new Date(), updated_at: new Date() },
    ]);

    // 2. Get role IDs
    const roles = await queryInterface.sequelize.query(
      'SELECT id, name FROM roles;'
    );
    const roleMap = {};
    roles[0].forEach(role => {
      roleMap[role.name] = role.id;
    });

    // 3. Define all possible permissions (matching actual project modules)
    const allPermissions = [
      // System Modules
      { module: 'dashboard', actions: ['view'] },
      { module: 'user', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'role', actions: ['view', 'create', 'edit', 'delete'] },
      
      // Inventory Modules
      { module: 'product', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'category', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'brand', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'supplier', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'purchase', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'purchase_item', actions: ['view', 'create', 'edit', 'delete'] },
      
      // Sales Modules
      { module: 'sale', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'sale_item', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'customer', actions: ['view', 'create', 'edit', 'delete'] },
      
      // Report Modules
      { module: 'import_report', actions: ['view', 'export'] },
      { module: 'sale_report', actions: ['view', 'export'] },
      
      // Notification Modules
      { module: 'notification', actions: ['view', 'create', 'mark_read', 'delete'] },
    ];

    // 4. Generate all possible permissions
    const permissionsToInsert = [];
    
    allPermissions.forEach(({ module, actions }) => {
      actions.forEach(action => {
        permissionsToInsert.push({
          name: `${action}_${module}`,
          description: `Can ${action.replace('_', ' ')} ${module}`,
          module,
          action,
          created_at: new Date(),
          updated_at: new Date()
        });
      });
    });

    // 5. Insert permissions
    await queryInterface.bulkInsert('permissions', permissionsToInsert);

    // 6. Get all permissions
    const permissions = await queryInterface.sequelize.query(
      'SELECT id, name, module, action FROM permissions;'
    );
    
    // 7. Define role-permission mappings
    const rolePermissions = {
      // Admin has all permissions
      ADMIN: permissions[0].map(p => p.name),
      
      // Manager has most permissions but limited system access
      MANAGER: permissions[0]
        .filter(p => ![
          'delete_user', 'create_role', 'edit_role', 'delete_role'
        ].includes(p.name))
        .map(p => p.name),
      
      // Inventory staff permissions
      INVENTORY: permissions[0]
        .filter(p => [
          'view_dashboard',
          'view_product', 'create_product', 'edit_product', 'delete_product',
          'view_category', 'create_category', 'edit_category', 'delete_category',
          'view_brand', 'create_brand', 'edit_brand', 'delete_brand',
          'view_supplier', 'create_supplier', 'edit_supplier', 'delete_supplier',
          'view_purchase', 'create_purchase', 'edit_purchase', 'delete_purchase',
          'view_purchase_item', 'create_purchase_item', 'edit_purchase_item', 'delete_purchase_item',
          'view_notification', 'create_notification', 'mark_read_notification', 'delete_notification',
          'view_import_report', 'export_import_report',
        ].includes(p.name))
        .map(p => p.name),
      
      // Sales staff permissions
      SALE: permissions[0]
        .filter(p => [
          'view_dashboard',
          'view_product', 'view_category', 'view_brand',
          'view_sale', 'create_sale', 'edit_sale', 'delete_sale',
          'view_sale_item', 'create_sale_item', 'edit_sale_item', 'delete_sale_item',
          'view_customer', 'create_customer', 'edit_customer', 'delete_customer',
          'view_sale_report', 'export_sale_report',
          'view_notification', 'create_notification', 'mark_read_notification', 'delete_notification',
        ].includes(p.name))
        .map(p => p.name),
      
      // Cashier permissions (limited sales access)
      CASHIER: permissions[0]
        .filter(p => [
          'view_dashboard',
          'view_product', 'view_category',
          'view_sale', 'create_sale',
          'view_sale_item', 'create_sale_item',
          'view_customer', 'create_customer',
          'view_notification', 'mark_read_notification',
        ].includes(p.name))
        .map(p => p.name),
      
      // Basic user permissions (view only)
      USER: permissions[0]
        .filter(p => [
          'view_dashboard',
          'view_product', 'view_category', 'view_brand', 'view_supplier',
          'view_sale', 'view_sale_item',
          'view_customer',
          'view_purchase', 'view_purchase_item',
          'view_notification', 'mark_read_notification',
        ].includes(p.name))
        .map(p => p.name),
    };

    // 8. Create role-permission mappings
    const rolePermissionMappings = [];
    
    Object.entries(rolePermissions).forEach(([roleName, permissionNames]) => {
      const roleId = roleMap[roleName];
      
      permissionNames.forEach(permissionName => {
        const permission = permissions[0].find(p => p.name === permissionName);
        if (permission) {
          rolePermissionMappings.push({
            role_id: roleId,
            permission_id: permission.id,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      });
    });

    // 9. Insert role-permission mappings
    await queryInterface.bulkInsert('role_permissions', rolePermissionMappings);
  },

  down: async (queryInterface, Sequelize) => {
    // First delete role_permissions
    await queryInterface.bulkDelete('role_permissions', null, {});
    // Then delete permissions
    await queryInterface.bulkDelete('permissions', null, {});
    // Finally delete roles
    await queryInterface.bulkDelete('roles', null, {});
  }
};