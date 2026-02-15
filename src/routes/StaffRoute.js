// routes/StaffRoute.js
const {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  toggleStaffStatus
} = require('../controllers/StaffController');
const auth = require('../middlewares/auth.middleware');

const StaffRoutes = (app) => {
  // Get all staff (requires authentication)
  app.get('/api/staff', auth.validate_token(), getAllStaff);
  
  // Get staff by ID (requires authentication)
  app.get('/api/staff/:id', auth.validate_token(), getStaffById);
  
  // Create new staff (requires authentication)
  app.post('/api/staff', auth.validate_token(), createStaff);
  
  // Update staff (requires authentication)
  app.put('/api/staff/:id', auth.validate_token(), updateStaff);
  
  // Delete staff (requires authentication)
  app.delete('/api/staff/:id', auth.validate_token(), deleteStaff);
  
  // Toggle staff status (requires authentication)
  app.patch('/api/staff/:id/toggle-status', auth.validate_token(), toggleStaffStatus);
};

module.exports = StaffRoutes;
