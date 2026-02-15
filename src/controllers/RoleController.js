const db = require("../models");
// const roleModel = require("../models/role.model");
const Role = db.Role;
// Create a new role
const createRole = async (req, res) => {
  const { name, description } = req.body;

  try {
    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      return res.status(400).json({ message: "Role already exists" });
    }

    const newRole = await Role.create({ name, description });
    res
      .status(201)
      .json({ message: "Role created successfully", roleId: newRole.id });
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all roles
const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.findAll();
    res.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get a role by ID
const getRoleById = async (req, res) => {
  const roleId = req.params.id;

  try {
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.json(role);
  } catch (error) {
    console.error("Error fetching role:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateRole = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Only check uniqueness if the name is being changed
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ where: { name } });
      if (existingRole) {
        return res.status(400).json({
          message: "A role with this name already exists",
        });
      }
    }

    await role.update({ name, description });

    res.status(200).json({
      message: "Role updated successfully",
      role,
    });
  } catch (error) {
    console.error("Error updating role:", error);

    // Handle other unexpected errors
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a role
const deleteRole = async (req, res) => {
  const roleId = req.params.id;

  try {
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    await role.destroy();
    res.json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error("Error deleting role:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
};
