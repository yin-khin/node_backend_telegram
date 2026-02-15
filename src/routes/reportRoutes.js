const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Import Reports
router.get('/imports', reportController.showImport);
router.get('/reports/imports/excel', reportController.exportImportReportExcel);
router.get('/reports/imports/pdf', reportController.exportImportReportPDF);

// Sales Reports
router.get('/reports/sales/excel', reportController.exportSalesReportExcel);
router.get('/reports/sales/pdf', reportController.exportSalesReportPDF);

// Profit Reports
router.get('/profits', reportController.showProfitReport);

module.exports = router;
