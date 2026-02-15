// routes/SetupRoute.js
const {
  initializeRolesAndPermissions,
  ensureUserRole,
  getSetupStatus,
  fixUserRolePermissions,
} = require("../controllers/SetupController");
const auth = require("../middlewares/auth.middleware")
const SetupRoutes = (app) => {
  // Get setup status
  app.get("/api/setup/status", auth.validate_token(),getSetupStatus);
  
  // Initialize roles and permissions (run seeder)
  app.post("/api/setup/init", auth.validate_token(),initializeRolesAndPermissions);
  
  // Quick fix: Create USER role if missing
  app.post("/api/setup/ensure-user-role",auth.validate_token(), ensureUserRole);
  
  // Fix USER role permissions (remove create/edit/delete, keep only view)
  app.post("/api/setup/fix-user-permissions", auth.validate_token(),fixUserRolePermissions);
};

module.exports = SetupRoutes;
