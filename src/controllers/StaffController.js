// controllers/StaffController.js
const db = require('../models');
const Staff = db.Staff;
const Role = db.Role;

// Get all staff
const getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.findAll({
      include: [
        {
          model: Role,
          as: "Role",
          attributes: ["id", "name"]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Log photo info for debugging
    if (staff.length > 0) {
      staff.forEach((s, index) => {
        if (s.photo) {
          console.log(`📸 Staff ${index + 1} (${s.name}) photo info:`, {
            hasPhoto: !!s.photo,
            photoLength: s.photo?.length,
            photoStart: s.photo?.substring(0, 50),
            startsWithData: s.photo?.startsWith('data:')
          });
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Staff retrieved successfully',
      data: staff
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching staff',
      error: error.message
    });
  }
};

// Get staff by ID
const getStaffById = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await Staff.findByPk(id, {
      include: [
        {
          model: Role,
          as: "Role",
          attributes: ["id", "name"]
        }
      ]
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Staff retrieved successfully',
      data: staff
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching staff',
      error: error.message
    });
  }
};

// Create new staff
const createStaff = async (req, res) => {
  try {
    const { staff_id, name, dob, gender, phone, role_id, photo, status } = req.body;

    // Validate required fields
    if (!staff_id || !name || !dob || !gender || !phone || !role_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if staff_id already exists
    const existingStaff = await Staff.findOne({ where: { staff_id } });
    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID already exists'
      });
    }

    const newStaff = await Staff.create({
      staff_id,
      name,
      dob,
      gender,
      phone,
      role_id,
      photo: photo || null,
      status: status !== undefined ? status : 1
    });

    const staffWithRole = await Staff.findByPk(newStaff.id, {
      include: [
        {
          model: Role,
          as: "Role",
          attributes: ["id", "name"]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Staff created successfully',
      data: staffWithRole
    });
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating staff',
      error: error.message
    });
  }
};

// Update staff
const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { staff_id, name, dob, gender, phone, role_id, photo, status } = req.body;

    const staff = await Staff.findByPk(id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    // Check if staff_id is being changed and if it already exists
    if (staff_id && staff_id !== staff.staff_id) {
      const existingStaff = await Staff.findOne({ where: { staff_id } });
      if (existingStaff) {
        return res.status(400).json({
          success: false,
          message: 'Staff ID already exists'
        });
      }
    }

    await staff.update({
      staff_id: staff_id || staff.staff_id,
      name: name || staff.name,
      dob: dob || staff.dob,
      gender: gender || staff.gender,
      phone: phone || staff.phone,
      role_id: role_id || staff.role_id,
      photo: photo !== undefined ? photo : staff.photo,
      status: status !== undefined ? status : staff.status
    });

    const updatedStaff = await Staff.findByPk(id, {
      include: [
        {
          model: Role,
          as: "Role",
          attributes: ["id", "name"]
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Staff updated successfully',
      data: updatedStaff
    });
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating staff',
      error: error.message
    });
  }
};

// Delete staff
const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await Staff.findByPk(id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    await staff.destroy();

    res.status(200).json({
      success: true,
      message: 'Staff deleted successfully',
      data: { id: parseInt(id) }
    });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting staff',
      error: error.message
    });
  }
};

// Toggle staff status
const toggleStaffStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await Staff.findByPk(id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    await staff.update({
      status: staff.status === 1 ? 0 : 1
    });

    const updatedStaff = await Staff.findByPk(id, {
      include: [
        {
          model: Role,
          as: "Role",
          attributes: ["id", "name"]
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Staff status updated successfully',
      data: updatedStaff
    });
  } catch (error) {
    console.error('Error toggling staff status:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling staff status',
      error: error.message
    });
  }
};

module.exports = {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  toggleStaffStatus
};
