const {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
} = require("../controllers/RoleController");
const auth = require("../middlewares/auth.middleware")
const Role = (app) => {
  // Create a new role
  app.post("/api/roles", auth.validate_token(),createRole);

  // Get all roles
  app.get("/api/roles", auth.validate_token(),getAllRoles);

  // Get a role by ID
  app.get("/api/roles/:id", auth.validate_token(),getRoleById);

  // Update a role
  app.put("/api/roles/:id", auth.validate_token(),updateRole);

  // Delete a role
  app.delete("/api/roles/:id",auth.validate_token(), deleteRole);
};

module.exports = Role;
