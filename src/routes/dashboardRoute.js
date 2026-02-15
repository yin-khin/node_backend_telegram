const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/dashboardController');
const auth = require("../middlewares/auth.middleware")
// Dashboard route
router.get('/dashboard', auth.validate_token(),getDashboardData);

module.exports = router;