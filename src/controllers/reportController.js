const excelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { Op } = require('sequelize');
const db = require('../models');
const Purchase = db.Purchase;
const PurchaseItem = db.PurchaseItem;
const Sale = db.Sale;
const SaleItem = db.SaleItem;
const Product = db.Product;
const Supplier = db.Supplier;
const Customer = db.Customer;

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// 1. Show all imports
const showImport = async (req, res) => {
  try {
    const { startDate, endDate, supplierId } = req.query;
    const where = {};
    
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    if (supplierId) {
      where.supplier_id = supplierId;
    }
    
    const imports = await Purchase.findAll({
      where,
      include: [
        {
          model: Supplier,
          as: "Supplier",
          attributes: ['id', 'name', 'phone_first']
        },
        {
          model: PurchaseItem,
          as: 'PurchaseItems',
          include: [{
            model: Product,
            as: "Product",
            attributes: ['id', 'name', 'barcode']
          }]
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      count: imports.length,
      data: imports
    });
  } catch (error) {
    console.error('Error fetching imports:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching imports',
      error: error.message
    });
  }
};

// // 2. Export Import Report (Excel)
// const exportImportReportExcel = async (req, res) => {
//   try {
//     const { startDate, endDate, supplierId } = req.query;
//     const where = {};
    
//     if (startDate && endDate) {
//       where.created_at = {
//         [Op.between]: [new Date(startDate), new Date(endDate)]
//       };
//     }
    
//     if (supplierId) {
//       where.supplier_id = supplierId;
//     }
    
//     const imports = await Purchase.findAll({
//       where,
//       include: [
//         {
//           model: Supplier,
//           as: "Supplier",
//           attributes: ['name']
//         },
//         {
//           model: PurchaseItem,
//           as: 'PurchaseItems',
//           include: [{
//             model: Product,
//             as: "Product",
//             attributes: ['name', 'barcode']
//           }]
//         }
//       ],
//       order: [['created_at', 'DESC']]
//     });

//     const workbook = new excelJS.Workbook();
//     const worksheet = workbook.addWorksheet('Import Report');

//     // Set columns
//     worksheet.columns = [
//       { header: 'Import ID', key: 'id', width: 15 },
//       { header: 'Date', key: 'date', width: 20 },
//       { header: 'Supplier', key: 'supplier', width: 30 },
//       { header: 'Product', key: 'product', width: 30 },
//       { header: 'Barcode', key: 'barcode', width: 20 },
//       { header: 'Qty', key: 'qty', width: 10 },
//       { header: 'Unit Cost', key: 'cost', width: 15 },
//       { header: 'Total', key: 'total', width: 15 },
//       { header: 'Status', key: 'status', width: 15 }
//     ];

//     // Style header
//     worksheet.getRow(1).font = { bold: true };

//     // Add data rows
//     imports.forEach(imp => {
//       if (imp.PurchaseItems && imp.PurchaseItems.length > 0) {
//         imp.PurchaseItems.forEach(item => {
//           worksheet.addRow({
//             id: imp.id,
//             date: new Date(imp.created_at).toLocaleString(),
//             supplier: imp.Supplier ? imp.Supplier.name : 'N/A',
//             product: item.Product ? item.Product.name : 'N/A',
//             barcode: item.Product ? item.Product.barcode : 'N/A',
//             qty: item.qty,
//             cost: item.cost_price,
//             total: item.qty * item.cost_price,
//             status: imp.balance > 0 ? 'Pending' : 'Paid'
//           });
//         });
//       }
//     });

//     // Add summary row
//     const totalRow = worksheet.addRow({});
//     totalRow.getCell('G').value = 'TOTAL:';
//     totalRow.getCell('G').font = { bold: true };
    
//     // Add formula for total
//     const lastRow = worksheet.rowCount;
//     if (lastRow > 1) {
//       worksheet.getCell(`H${lastRow}`).value = {
//         formula: `SUM(H2:H${lastRow - 1})`,
//         date1904: false
//       };
//       worksheet.getCell(`H${lastRow}`).font = { bold: true };
//     }

//     // Set response headers
//     res.setHeader(
//       'Content-Type',
//       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//     );
//     res.setHeader(
//       'Content-Disposition',
//       `attachment; filename=import_report_${new Date().toISOString().split('T')[0]}.xlsx`
//     );

//     // Write to response
//     await workbook.xlsx.write(res);
//     res.end();
//   } catch (error) {
//     console.error('Error generating import report (Excel):', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error generating import report',
//       error: error.message
//     });
//   }
// };

// // 3. Export Import Report (PDF)
// const exportImportReportPDF = async (req, res) => {
//   try {
//     const { startDate, endDate, supplierId } = req.query;
//     const where = {};
    
//     if (startDate && endDate) {
//       where.created_at = {
//         [Op.between]: [new Date(startDate), new Date(endDate)]
//       };
//     }
    
//     if (supplierId) {
//       where.supplier_id = supplierId;
//     }
    
//     const imports = await Purchase.findAll({
//       where,
//       include: [
//         {
//           model: Supplier,
//           as: "Supplier",
//           attributes: ['name']
//         },
//         {
//           model: PurchaseItem,
//           as: 'PurchaseItems',
//           include: [{
//             model: Product,
//             as: "Product",
//             attributes: ['name', 'barcode']
//           }]
//         }
//       ],
//       order: [['created_at', 'DESC']]
//     });

//     const doc = new PDFDocument({ margin: 30, size: 'A4' });
    
//     // Set response headers
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader(
//       'Content-Disposition',
//       `attachment; filename=import_report_${new Date().toISOString().split('T')[0]}.pdf`
//     );

//     // Pipe PDF to response
//     doc.pipe(res);

//     // Add title
//     doc.fontSize(18).text('IMPORT REPORT', { align: 'center' });
//     doc.moveDown();
    
//     // Add date range if provided
//     if (startDate && endDate) {
//       doc.fontSize(12).text(
//         `Date Range: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
//         { align: 'center' }
//       );
//     }
    
//     doc.moveDown();

//     // Add table headers
//     const tableTop = doc.y;
//     let y = tableTop;
//     const rowHeight = 20;
//     const colWidth = doc.page.width - 100;
//     const cellPadding = 5;
    
//     // Draw table headers
//     doc.font('Helvetica-Bold');
//     doc.rect(50, y, colWidth, rowHeight).stroke();
//     doc.text('Date', 55, y + cellPadding, { width: 80, align: 'left' });
//     doc.text('Supplier', 140, y + cellPadding, { width: 100, align: 'left' });
//     doc.text('Product', 250, y + cellPadding, { width: 120, align: 'left' });
//     doc.text('Qty', 380, y + cellPadding, { width: 40, align: 'right' });
//     doc.text('Total', 430, y + cellPadding, { width: 70, align: 'right' });

//     // Reset font for data
//     doc.font('Helvetica');
//     y += rowHeight;

//     // Add data rows
//     let totalAmount = 0;
    
//     for (const imp of imports) {
//       if (imp.PurchaseItems && imp.PurchaseItems.length > 0) {
//         for (const item of imp.PurchaseItems) {
//           const itemTotal = item.qty * item.cost_price;
//           totalAmount += itemTotal;
          
//           doc.rect(50, y, colWidth, rowHeight).stroke();
//           doc.text(
//             new Date(imp.created_at).toLocaleDateString(),
//             55,
//             y + cellPadding,
//             { width: 80, align: 'left' }
//           );
//           doc.text(
//             imp.Supplier ? imp.Supplier.name : 'N/A',
//             140,
//             y + cellPadding,
//             { width: 100, align: 'left' }
//           );
//           doc.text(
//             item.Product ? item.Product.name : 'N/A',
//             250,
//             y + cellPadding,
//             { width: 120, align: 'left' }
//           );
//           doc.text(
//             item.qty.toString(),
//             380,
//             y + cellPadding,
//             { width: 40, align: 'right' }
//           );
//           doc.text(
//             formatCurrency(itemTotal),
//             430,
//             y + cellPadding,
//             { width: 70, align: 'right' }
//           );
          
//           y += rowHeight;
          
//           // Add new page if needed
//           if (y > doc.page.height - 100) {
//             doc.addPage();
//             y = 50;
//           }
//         }
//       }
//     }

//     // Add total
//     doc.rect(50, y, colWidth, rowHeight).stroke();
//     doc.font('Helvetica-Bold');
//     doc.text('TOTAL:', 380, y + cellPadding, { width: 40, align: 'right' });
//     doc.text(formatCurrency(totalAmount), 430, y + cellPadding, { width: 70, align: 'right' });

//     // Finalize PDF
//     doc.end();
//   } catch (error) {
//     console.error('Error generating import report (PDF):', error);
//     if (!res.headersSent) {
//       res.status(500).json({
//         success: false,
//         message: 'Error generating import report',
//         error: error.message
//       });
//     }
//   }
// };
// 3. Export Import Report (PDF) with MFG & EXP
// 2. Export Import Report (Excel) with MFG & EXP
const exportImportReportExcel = async (req, res) => {
  try {
    const { startDate, endDate, supplierId } = req.query;
    const where = {};

    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    if (supplierId) {
      where.supplier_id = supplierId;
    }

    const imports = await Purchase.findAll({
      where,
      include: [
        {
          model: Supplier,
          as: "Supplier",
          attributes: ["name"],
        },
        {
          model: PurchaseItem,
          as: "PurchaseItems",
          include: [
            {
              model: Product,
              as: "Product",
              attributes: ["name", "barcode"],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Import Report");

    // ===== COLUMNS =====
    worksheet.columns = [
      { header: "Import ID", key: "id", width: 12 },
      { header: "Date", key: "date", width: 15 },
      { header: "Supplier", key: "supplier", width: 25 },
      { header: "Product", key: "product", width: 30 },
      { header: "Barcode", key: "barcode", width: 18 },
      { header: "Qty", key: "qty", width: 10 },
      { header: "Unit Cost", key: "cost", width: 15 },
      { header: "MFG Date", key: "mfg", width: 15 },
      { header: "EXP Date", key: "exp", width: 15 },
      { header: "Total", key: "total", width: 15 },
      { header: "Status", key: "status", width: 12 },
    ];

    // Header style
    worksheet.getRow(1).font = { bold: true };

    // ===== DATA ROWS =====
    imports.forEach((imp) => {
      if (imp.PurchaseItems && imp.PurchaseItems.length > 0) {
        imp.PurchaseItems.forEach((item) => {
          worksheet.addRow({
            id: imp.id,
            date: new Date(imp.created_at).toLocaleDateString(),
            supplier: imp.Supplier ? imp.Supplier.name : "N/A",
            product: item.Product ? item.Product.name : "N/A",
            barcode: item.Product ? item.Product.barcode : "N/A",
            qty: item.qty,
            cost: item.cost_price,
            mfg: item.manufacture_date
              ? new Date(item.manufacture_date).toLocaleDateString()
              : "",
            exp: item.expire_date
              ? new Date(item.expire_date).toLocaleDateString()
              : "",
            total: item.qty * item.cost_price,
            status: imp.balance > 0 ? "Pending" : "Paid",
          });
        });
      }
    });

    // ===== SUMMARY TOTAL =====
    const totalRowIndex = worksheet.rowCount + 1;
    worksheet.addRow({});

    worksheet.getCell(`I${totalRowIndex}`).value = "TOTAL:";
    worksheet.getCell(`I${totalRowIndex}`).font = { bold: true };

    worksheet.getCell(`J${totalRowIndex}`).value = {
      formula: `SUM(J2:J${totalRowIndex - 1})`,
    };
    worksheet.getCell(`J${totalRowIndex}`).font = { bold: true };

    // ===== RESPONSE =====
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=import_report_${new Date()
        .toISOString()
        .split("T")[0]}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating import report (Excel):", error);
    res.status(500).json({
      success: false,
      message: "Error generating import report",
      error: error.message,
    });
  }
};


// const exportImportReportPDF = async (req, res) => {
//   try {
//     const { startDate, endDate, supplierId } = req.query;
//     const where = {};

//     if (startDate && endDate) {
//       where.created_at = {
//         [Op.between]: [new Date(startDate), new Date(endDate)],
//       };
//     }

//     if (supplierId) {
//       where.supplier_id = supplierId;
//     }

//     const imports = await Purchase.findAll({
//       where,
//       include: [
//         {
//           model: Supplier,
//           as: "Supplier",
//           attributes: ["name"],
//         },
//         {
//           model: PurchaseItem,
//           as: "PurchaseItems",
//           include: [
//             {
//               model: Product,
//               as: "Product",
//               attributes: ["name", "barcode"],
//             },
//           ],
//         },
//       ],
//       order: [["created_at", "DESC"]],
//     });

//     const doc = new PDFDocument({ margin: 30, size: "A4" });

//     // Headers
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=import_report_${new Date()
//         .toISOString()
//         .split("T")[0]}.pdf`
//     );

//     doc.pipe(res);

//     // ===== TITLE =====
//     doc.fontSize(16).text("INVENTORY MANAGEMENT SYSTEM", { align: "center" });
//     doc.moveDown(0.3);
//     doc.fontSize(18).text("IMPORT REPORT", { align: "center" });
//     doc.moveDown();

//     if (startDate && endDate) {
//       doc.fontSize(11).text(
//         `Date Range: ${new Date(startDate).toLocaleDateString()} - ${new Date(
//           endDate
//         ).toLocaleDateString()}`,
//         { align: "center" }
//       );
//       doc.moveDown();
//     }

//     // ===== TABLE HEADER =====
//     let y = doc.y;
//     const rowHeight = 20;
//     const cellPadding = 5;
//     const tableWidth = doc.page.width - 80;

//     doc.font("Helvetica-Bold");
//     doc.rect(40, y, tableWidth, rowHeight).stroke();

//     doc.text("Date", 45, y + cellPadding, { width: 70 });
//     doc.text("Supplier", 120, y + cellPadding, { width: 90 });
//     doc.text("Product", 220, y + cellPadding, { width: 100 });
//     doc.text("Qty", 330, y + cellPadding, { width: 30, align: "right" });
//     doc.text("MFG", 370, y + cellPadding, { width: 70 });
//     doc.text("EXP", 445, y + cellPadding, { width: 70 });
//     doc.text("Total", 520, y + cellPadding, { width: 60, align: "right" });

//     doc.font("Helvetica");
//     y += rowHeight;

//     // ===== TABLE ROWS =====
//     let totalAmount = 0;

//     for (const imp of imports) {
//       if (imp.PurchaseItems && imp.PurchaseItems.length > 0) {
//         for (const item of imp.PurchaseItems) {
//           const itemTotal = item.qty * item.cost_price;
//           totalAmount += itemTotal;

//           doc.rect(40, y, tableWidth, rowHeight).stroke();

//           doc.text(new Date(imp.created_at).toLocaleDateString(), 45, y + cellPadding, { width: 70 });
//           doc.text(imp.Supplier ? imp.Supplier.name : "N/A", 120, y + cellPadding, { width: 90 });
//           doc.text(item.Product ? item.Product.name : "N/A", 220, y + cellPadding, { width: 100 });
//           doc.text(item.qty.toString(), 330, y + cellPadding, { width: 30, align: "right" });

//           doc.text(
//             item.manufacture_date
//               ? new Date(item.manufacture_date).toLocaleDateString()
//               : "-",
//             370,
//             y + cellPadding,
//             { width: 70 }
//           );

//           doc.text(
//             item.expire_date ? new Date(item.expire_date).toLocaleDateString() : "-",
//             445,
//             y + cellPadding,
//             { width: 70 }
//           );

//           doc.text(formatCurrency(itemTotal), 520, y + cellPadding, { width: 60, align: "right" });

//           y += rowHeight;

//           if (y > doc.page.height - 100) {
//             doc.addPage();
//             y = 50;
//           }
//         }
//       }
//     }

//     // ===== TOTAL =====
//     doc.font("Helvetica-Bold");
//     doc.rect(40, y, tableWidth, rowHeight).stroke();
//     doc.text("TOTAL:", 445, y + cellPadding, { width: 70, align: "right" });
//     doc.text(formatCurrency(totalAmount), 520, y + cellPadding, { width: 60, align: "right" });

//     doc.end();
//   } catch (error) {
//     console.error("Error generating import report (PDF):", error);
//     if (!res.headersSent) {
//       res.status(500).json({
//         success: false,
//         message: "Error generating import report",
//         error: error.message,
//       });
//     }
//   }
// };


const exportImportReportPDF = async (req, res) => {
  try {
    const { startDate, endDate, supplierId } = req.query;
    const where = {};

    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    if (supplierId) where.supplier_id = supplierId;

    const imports = await Purchase.findAll({
      where,
      include: [
        { model: Supplier, as: "Supplier", attributes: ["name"] },
        {
          model: PurchaseItem,
          as: "PurchaseItems",
          include: [{ model: Product, as: "Product", attributes: ["name"] }],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=import_report_${Date.now()}.pdf`
    );

    doc.pipe(res);

    // ===== TITLE =====
    doc.fontSize(18).text("INVENTORY MANAGEMENT SYSTEM", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(14).text("IMPORT REPORT", { align: "center" });
    doc.moveDown(1);

    // ===== TABLE CONFIG =====
    const startX = 40;
    let y = doc.y;

    const col = {
      date: 70,
      supplier: 90,
      product: 110,
      qty: 40,
      mfg: 70,
      exp: 70,
      total: 70,
    };

    const rowHeight = 22;

    // ===== HEADER =====
    doc.rect(startX, y, 520, rowHeight).fill("#1f2933");
    doc.fillColor("white").fontSize(10).font("Helvetica-Bold");

    let x = startX;
    doc.text("Date", x + 4, y + 6, { width: col.date }); x += col.date;
    doc.text("Supplier", x + 4, y + 6, { width: col.supplier }); x += col.supplier;
    doc.text("Product", x + 4, y + 6, { width: col.product }); x += col.product;
    doc.text("Qty", x + 4, y + 6, { width: col.qty, align: "right" }); x += col.qty;
    doc.text("MFG", x + 4, y + 6, { width: col.mfg }); x += col.mfg;
    doc.text("EXP", x + 4, y + 6, { width: col.exp }); x += col.exp;
    doc.text("Total", x + 4, y + 6, { width: col.total, align: "right" });

    y += rowHeight;

    doc.font("Helvetica").fillColor("black");

    // ===== ROWS =====
    let totalAmount = 0;
    let rowIndex = 0;

    for (const imp of imports) {
      for (const item of imp.PurchaseItems) {
        if (y > doc.page.height - 80) {
          doc.addPage();
          y = 40;
        }

        if (rowIndex % 2 === 0) {
          doc.rect(startX, y, 520, rowHeight).fill("#f3f4f6");
          doc.fillColor("black");
        }

        const itemTotal = item.qty * item.cost_price;
        totalAmount += itemTotal;

        x = startX;

        doc.text(formatDate(imp.created_at), x + 4, y + 6, { width: col.date });
        x += col.date;

        doc.text(imp.Supplier?.name || "", x + 4, y + 6, { width: col.supplier });
        x += col.supplier;

        doc.text(item.Product?.name || "", x + 4, y + 6, { width: col.product });
        x += col.product;

        doc.text(item.qty, x, y + 6, { width: col.qty - 4, align: "right" });
        x += col.qty;

        doc.text(formatDate(item.manufacture_date), x + 4, y + 6, { width: col.mfg });
        x += col.mfg;

        doc.text(formatDate(item.expire_date), x + 4, y + 6, { width: col.exp });
        x += col.exp;

        doc.text(formatCurrency(itemTotal), x, y + 6, {
          width: col.total - 4,
          align: "right",
        });

        y += rowHeight;
        rowIndex++;
      }
    }

    // ===== TOTAL =====
    doc.moveDown(1);
    doc.font("Helvetica-Bold").fontSize(12);
    doc.text(`TOTAL: ${formatCurrency(totalAmount)}`, 400, y + 10, {
      align: "right",
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "PDF Export Failed" });
  }
};

// ===== HELPERS =====
function formatDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt)) return "-";
  return dt.toLocaleDateString("en-GB");
}

// function formatCurrency(n) {
//   return "$" + Number(n).toLocaleString();
// }



// // 4. Export Sales Report (Excel)
// const exportSalesReportExcel = async (req, res) => {
//   try {
//     const { startDate, endDate, customerId } = req.query;
//     const where = {};
    
//     if (startDate && endDate) {
//       where.sale_date = {
//         [Op.between]: [new Date(startDate), new Date(endDate)]
//       };
//     }
    
//     if (customerId) {
//       where.customer_id = customerId;
//     }
    
//     const sales = await Sale.findAll({
//       where,
//       include: [
//         {
//           model: Customer,
//           as: "Customer",
//           attributes: ['name']
//         },
//         {
//           model: SaleItem,
//           as: 'SaleItems',
//           include: [{
//             model: Product,
//             as: "Product",
//             attributes: ['name', 'barcode']
//           }]
//         }
//       ],
//       order: [['sale_date', 'DESC']]
//     });

//     const workbook = new excelJS.Workbook();
//     const worksheet = workbook.addWorksheet('Sales Report');

//     // Set columns
//     worksheet.columns = [
//       { header: 'Sale ID', key: 'id', width: 15 },
//       { header: 'Date', key: 'date', width: 20 },
//       { header: 'Customer', key: 'customer', width: 30 },
//       { header: 'Product', key: 'product', width: 30 },
//       { header: 'Barcode', key: 'barcode', width: 20 },
//       { header: 'Qty', key: 'qty', width: 10 },
//       { header: 'Unit Price', key: 'price', width: 15 },
//       { header: 'Total', key: 'total', width: 15 },
//       { header: 'Status', key: 'status', width: 15 }
//     ];

//     // Style header
//     worksheet.getRow(1).font = { bold: true };

//     // Add data rows
//     sales.forEach(sale => {
//       if (sale.SaleItems && sale.SaleItems.length > 0) {
//         sale.SaleItems.forEach(item => {
//           worksheet.addRow({
//             id: sale.id,
//             date: new Date(sale.sale_date).toLocaleString(),
//             customer: sale.Customer ? sale.Customer.name : 'Walk-in',
//             product: item.Product ? item.Product.name : 'N/A',
//             barcode: item.Product ? item.Product.barcode : 'N/A',
//             qty: item.quantity,
//             price: item.unit_price,
//             total: item.quantity * item.unit_price,
//             status: sale.balance > 0 ? 'Pending' : 'Paid'
//           });
//         });
//       }
//     });

//     // Add summary row
//     const totalRow = worksheet.addRow({});
//     totalRow.getCell('G').value = 'TOTAL:';
//     totalRow.getCell('G').font = { bold: true };
    
//     // Add formula for total
//     const lastRow = worksheet.rowCount;
//     if (lastRow > 1) {
//       worksheet.getCell(`H${lastRow}`).value = {
//         formula: `SUM(H2:H${lastRow - 1})`,
//         date1904: false
//       };
//       worksheet.getCell(`H${lastRow}`).font = { bold: true };
//     }

//     // Set response headers
//     res.setHeader(
//       'Content-Type',
//       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//     );
//     res.setHeader(
//       'Content-Disposition',
//       `attachment; filename=sales_report_${new Date().toISOString().split('T')[0]}.xlsx`
//     );

//     // Write to response
//     await workbook.xlsx.write(res);
//     res.end();
//   } catch (error) {
//     console.error('Error generating sales report (Excel):', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error generating sales report',
//       error: error.message
//     });
//   }
// };


// // 5. Export Sales Report (PDF)
// const exportSalesReportPDF = async (req, res) => {
//   try {
//     const { startDate, endDate, customerId } = req.query;
//     const where = {};

//     if (startDate && endDate) {
//       where.sale_date = {
//         [Op.between]: [new Date(startDate), new Date(endDate)],
//       };
//     }

//     if (customerId) where.customer_id = customerId;

//     const sales = await Sale.findAll({
//       where,
//       include: [
//         { model: Customer, as: "Customer", attributes: ["name"] },
//         {
//           model: SaleItem,
//           as: "SaleItems",
//           include: [{ model: Product, as: "Product", attributes: ["name"] }],
//         },
//       ],
//       order: [["sale_date", "DESC"]],
//     });

//     const doc = new PDFDocument({ margin: 40, size: "A4" });

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=sales_report_${Date.now()}.pdf`
//     );

//     doc.pipe(res);

//     // ===== TITLE =====
//     doc.fontSize(18).text("INVENTORY MANAGEMENT SYSTEM", { align: "center" });
//     doc.moveDown(0.3);
//     doc.fontSize(14).text("SALES REPORT", { align: "center" });
//     doc.moveDown(1);

//     // ===== TABLE CONFIG =====
//     const startX = 40;
//     let y = doc.y;

//     const col = {
//       date: 70,
//       customer: 90,
//       product: 150,
//       qty: 40,
//       total: 80,
//     };

//     const rowHeight = 22;

//     // ===== HEADER =====
//     doc.rect(startX, y, 500, rowHeight).fill("#1f2933");
//     doc.fillColor("white").fontSize(10).font("Helvetica-Bold");

//     let x = startX;
//     doc.text("Date", x + 4, y + 6, { width: col.date }); x += col.date;
//     doc.text("Customer", x + 4, y + 6, { width: col.customer }); x += col.customer;
//     doc.text("Product", x + 4, y + 6, { width: col.product }); x += col.product;
//     doc.text("Qty", x, y + 6, { width: col.qty, align: "right" }); x += col.qty;
//     doc.text("Total", x, y + 6, { width: col.total, align: "right" });

//     y += rowHeight;
//     doc.font("Helvetica").fillColor("black");

//     // ===== ROWS =====
//     let totalAmount = 0;
//     let rowIndex = 0;

//     for (const sale of sales) {
//       for (const item of sale.SaleItems) {
//         if (y > doc.page.height - 80) {
//           doc.addPage();
//           y = 40;
//         }

//         if (rowIndex % 2 === 0) {
//           doc.rect(startX, y, 500, rowHeight).fill("#f3f4f6");
//           doc.fillColor("black");
//         }

//         const itemTotal = item.quantity * item.unit_price;
//         totalAmount += itemTotal;

//         x = startX;

//         doc.text(formatDate(sale.sale_date), x + 4, y + 6, { width: col.date });
//         x += col.date;

//         doc.text(sale.Customer?.name || "Walk-in", x + 4, y + 6, { width: col.customer });
//         x += col.customer;

//         doc.text(item.Product?.name || "", x + 4, y + 6, { width: col.product });
//         x += col.product;

//         doc.text(item.quantity.toString(), x, y + 6, { width: col.qty - 4, align: "right" });
//         x += col.qty;

//         doc.text(formatCurrency(itemTotal), x, y + 6, { width: col.total - 4, align: "right" });

//         y += rowHeight;
//         rowIndex++;
//       }
//     }

//     // ===== TOTAL =====
//     doc.moveDown(1);
//     doc.font("Helvetica-Bold").fontSize(12);
//     doc.text(`TOTAL: ${formatCurrency(totalAmount)}`, 400, y + 10, {
//       align: "right",
//     });

//     doc.end();
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "PDF Export Failed" });
//   }
// };

// // ===== HELPERS =====
// function formatDate(d) {
//   if (!d) return "-";
//   const dt = new Date(d);
//   if (isNaN(dt)) return "-";
//   return dt.toLocaleDateString("en-GB");
// }


// 4. Export Sales Report (Excel)
// 4. Export Sales Report (Excel) - FIXED VERSION
const exportSalesReportExcel = async (req, res) => {
  try {
    const { startDate, endDate, customerId } = req.query;
    const where = {};
    
    if (startDate && endDate) {
      where.sale_date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    if (customerId) {
      where.customer_id = customerId;
    }
    
    const sales = await Sale.findAll({
      where,
      include: [
        {
          model: Customer,
          as: "Customer",
          attributes: ['name']
        },
        {
          model: SaleItem,
          as: 'SaleItems',
          include: [{
            model: Product,
            as: "Product",
            attributes: ['name', 'barcode']
          }]
        }
      ],
      order: [['sale_date', 'DESC']]
    });

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    // Set columns
    worksheet.columns = [
      { header: 'Sale ID', key: 'id', width: 10 },
      { header: 'Date', key: 'date', width: 18 },
      { header: 'Customer', key: 'customer', width: 20 },
      { header: 'Product', key: 'product', width: 25 },
      { header: 'Barcode', key: 'barcode', width: 15 },
      { header: 'Qty', key: 'qty', width: 8 },
      { header: 'Unit Price', key: 'price', width: 12 },
      { header: 'Subtotal', key: 'subtotal', width: 12 },
      { header: 'Discount', key: 'discount', width: 12 },
      { header: 'Total', key: 'total', width: 12 },
      { header: 'Paid', key: 'paid', width: 12 },
      { header: 'Debt', key: 'debt', width: 12 },
      { header: 'Status', key: 'status', width: 12 }
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1f2933' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data rows
    sales.forEach(sale => {
      if (sale.SaleItems && sale.SaleItems.length > 0) {
        // Calculate sale totals
        const saleSubtotal = sale.SaleItems.reduce((sum, item) => 
          sum + (parseFloat(item.quantity) * parseFloat(item.unit_price)), 0
        );
        const saleDiscount = parseFloat(sale.discount) || 0;
        const saleTotal = parseFloat(sale.total) || (saleSubtotal - saleDiscount);
        const salePaid = parseFloat(sale.paid) || 0;
        const saleDebt = parseFloat(sale.balance) || 0;
        
        sale.SaleItems.forEach((item, index) => {
          const itemSubtotal = parseFloat(item.quantity) * parseFloat(item.unit_price);
          
          const row = worksheet.addRow({
            id: sale.id,
            date: new Date(sale.sale_date).toLocaleString(),
            customer: sale.Customer ? sale.Customer.name : 'Walk-in',
            product: item.Product ? item.Product.name : 'N/A',
            barcode: item.Product ? item.Product.barcode : 'N/A',
            qty: parseFloat(item.quantity),
            price: parseFloat(item.unit_price),
            subtotal: itemSubtotal,
            // Show totals only on first item row
            discount: index === 0 ? saleDiscount : '',
            total: index === 0 ? saleTotal : '',
            paid: index === 0 ? salePaid : '',
            debt: index === 0 ? saleDebt : '',
            status: index === 0 ? (saleDebt > 0 ? 'Pending' : 'Paid') : ''
          });

          // Center align all cells
          row.alignment = { vertical: 'middle', horizontal: 'center' };
          
          // Format number cells
          row.getCell('price').numFmt = '$#,##0.00';
          row.getCell('subtotal').numFmt = '$#,##0.00';
          if (index === 0) {
            row.getCell('discount').numFmt = '$#,##0.00';
            row.getCell('total').numFmt = '$#,##0.00';
            row.getCell('paid').numFmt = '$#,##0.00';
            row.getCell('debt').numFmt = '$#,##0.00';
          }
        });
      }
    });

    // Add summary row
    const totalRow = worksheet.addRow({});
    const lastRow = worksheet.rowCount;
    
    // Style total row
    totalRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1f2933' }
    };
    totalRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Add "TOTAL:" label
    totalRow.getCell('H').value = 'TOTAL:';
    
    // Calculate grand totals
    let grandDiscount = 0;
    let grandTotal = 0;
    let grandPaid = 0;
    let grandDebt = 0;
    
    sales.forEach(sale => {
      const saleSubtotal = sale.SaleItems.reduce((sum, item) => 
        sum + (parseFloat(item.quantity) * parseFloat(item.unit_price)), 0
      );
      grandDiscount += parseFloat(sale.discount) || 0;
      grandTotal += parseFloat(sale.total) || (saleSubtotal - (parseFloat(sale.discount) || 0));
      grandPaid += parseFloat(sale.paid) || 0;
      grandDebt += parseFloat(sale.balance) || 0;
    });
    
    // Set values (not formulas)
    totalRow.getCell('I').value = grandDiscount;
    totalRow.getCell('I').numFmt = '$#,##0.00';
    
    totalRow.getCell('J').value = grandTotal;
    totalRow.getCell('J').numFmt = '$#,##0.00';
    
    totalRow.getCell('K').value = grandPaid;
    totalRow.getCell('K').numFmt = '$#,##0.00';
    
    totalRow.getCell('L').value = grandDebt;
    totalRow.getCell('L').numFmt = '$#,##0.00';

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=sales_report_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating sales report (Excel):', error);
    res.status(500).json({
      success: false,
      message: 'Error generating sales report',
      error: error.message
    });
  }
};
// 5. Export Sales Report (PDF) - FULLY CENTERED VERSION
const exportSalesReportPDF = async (req, res) => {
  try {
    const { startDate, endDate, customerId } = req.query;
    const where = {};

    if (startDate && endDate) {
      where.sale_date = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    if (customerId) where.customer_id = customerId;

    const sales = await Sale.findAll({
      where,
      include: [
        { model: Customer, as: "Customer", attributes: ["name"] },
        {
          model: SaleItem,
          as: "SaleItems",
          include: [{ model: Product, as: "Product", attributes: ["name"] }],
        },
      ],
      order: [["sale_date", "DESC"]],
    });

    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sales_report_${Date.now()}.pdf`
    );

    doc.pipe(res);

    // ===== TITLE =====
    doc.fontSize(18).text("INVENTORY MANAGEMENT SYSTEM", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(14).text("SALES REPORT", { align: "center" });
    doc.moveDown(1);

    // ===== TABLE CONFIG =====
    const startX = 30;
    let y = doc.y;

    const col = {
      date: 65,
      customer: 75,
      product: 100,
      qty: 35,
      price: 55,
      discount: 55,
      total: 55,
      paid: 55,
      debt: 55,
    };

    const rowHeight = 22;
    const tableWidth = Object.values(col).reduce((a, b) => a + b, 0);

    // ===== HEADER =====
    doc.rect(startX, y, tableWidth, rowHeight).fill("#1f2933");
    doc.fillColor("white").fontSize(10).font("Helvetica-Bold");

    let x = startX;
    doc.text("Date", x, y + 6, { width: col.date, align: "center" }); x += col.date;
    doc.text("Customer", x, y + 6, { width: col.customer, align: "center" }); x += col.customer;
    doc.text("Product", x, y + 6, { width: col.product, align: "center" }); x += col.product;
    doc.text("Qty", x, y + 6, { width: col.qty, align: "center" }); x += col.qty;
    doc.text("Price", x, y + 6, { width: col.price, align: "center" }); x += col.price;
    doc.text("Discount", x, y + 6, { width: col.discount, align: "center" }); x += col.discount;
    doc.text("Total", x, y + 6, { width: col.total, align: "center" }); x += col.total;
    doc.text("Paid", x, y + 6, { width: col.paid, align: "center" }); x += col.paid;
    doc.text("Debt", x, y + 6, { width: col.debt, align: "center" });

    y += rowHeight;
    doc.font("Helvetica").fillColor("black");

    // ===== ROWS =====
    let totalDiscount = 0;
    let totalAmount = 0;
    let totalPaid = 0;
    let totalDebt = 0;
    let rowIndex = 0;

    for (const sale of sales) {
      // Calculate sale totals
      const saleSubtotal = sale.SaleItems.reduce((sum, item) => 
        sum + (parseFloat(item.quantity) * parseFloat(item.unit_price)), 0
      );
      const saleDiscount = parseFloat(sale.discount) || 0;
      const saleTotal = parseFloat(sale.total) || (saleSubtotal - saleDiscount);
      const salePaid = parseFloat(sale.paid) || 0;
      const saleDebt = parseFloat(sale.balance) || 0;
      
      // Add to grand totals
      totalDiscount += saleDiscount;
      totalAmount += saleTotal;
      totalPaid += salePaid;
      totalDebt += saleDebt;

      for (let i = 0; i < sale.SaleItems.length; i++) {
        const item = sale.SaleItems[i];
        
        if (y > doc.page.height - 80) {
          doc.addPage({ layout: 'landscape' });
          y = 50;
        }

        if (rowIndex % 2 === 0) {
          doc.rect(startX, y, tableWidth, rowHeight).fill("#f3f4f6");
          doc.fillColor("black");
        }

        x = startX;
        doc.fontSize(9);

        doc.text(formatDate(sale.sale_date), x, y + 6, { width: col.date, align: "center" });
        x += col.date;

        doc.text(sale.Customer?.name || "Walk-in", x, y + 6, { width: col.customer, align: "center" });
        x += col.customer;

        doc.text(item.Product?.name || "", x, y + 6, { width: col.product, align: "center" });
        x += col.product;

        doc.text(item.quantity.toString(), x, y + 6, { width: col.qty, align: "center" });
        x += col.qty;

        doc.text(formatCurrency(item.unit_price), x, y + 6, { width: col.price, align: "center" });
        x += col.price;

        // Show discount, total, paid, debt only on first item
        if (i === 0) {
          doc.text(formatCurrency(saleDiscount), x, y + 6, { width: col.discount, align: "center" });
          x += col.discount;

          doc.text(formatCurrency(saleTotal), x, y + 6, { width: col.total, align: "center" });
          x += col.total;

          doc.text(formatCurrency(salePaid), x, y + 6, { width: col.paid, align: "center" });
          x += col.paid;

          doc.text(formatCurrency(saleDebt), x, y + 6, { width: col.debt, align: "center" });
        }

        y += rowHeight;
        rowIndex++;
      }
    }

    // ===== TOTALS =====
    y += 5;
    doc.rect(startX, y, tableWidth, rowHeight).fill("#1f2933");
    doc.fillColor("white").fontSize(10).font("Helvetica-Bold");

    x = startX;
    
    // TOTALS label centered across first 5 columns
    const totalsLabelWidth = col.date + col.customer + col.product + col.qty + col.price;
    doc.text("TOTALS:", x, y + 6, { width: totalsLabelWidth, align: "center" });
    x += totalsLabelWidth;

    doc.text(formatCurrency(totalDiscount), x, y + 6, { width: col.discount, align: "center" });
    x += col.discount;

    doc.text(formatCurrency(totalAmount), x, y + 6, { width: col.total, align: "center" });
    x += col.total;

    doc.text(formatCurrency(totalPaid), x, y + 6, { width: col.paid, align: "center" });
    x += col.paid;

    doc.text(formatCurrency(totalDebt), x, y + 6, { width: col.debt, align: "center" });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "PDF Export Failed" });
  }
};

// ===== HELPERS =====
function formatDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt)) return "-";
  return dt.toLocaleDateString("en-GB");
}



// function formatCurrency(amount) {
//   const num = parseFloat(amount) || 0;
//   return `$${num.toFixed(2)}`;
// }


// function formatCurrency(amount) {
//   return `$${parseFloat(amount || 0).toFixed(2)}`;
// }


// 6. Show profit report
const showProfitReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};
    
    if (startDate && endDate) {
      where.sale_date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    // Get sales data with purchase costs
    const sales = await Sale.findAll({
      where,
      include: [
        {
          model: Customer,
          as: "Customer",
          attributes: ['name']
        },
        {
          model: SaleItem,
          as: 'SaleItems',
          include: [{
            model: Product,
            as: "Product",
            attributes: ['id', 'name', 'barcode'],
            include: [{
              model: PurchaseItem,
              as: "PurchaseItems",
              attributes: ['cost_price'],
              limit: 1,
              order: [['id', 'DESC']] // Get latest purchase cost
            }]
          }]
        }
      ],
      order: [['sale_date', 'DESC']]
    });

    // Calculate profit for each sale
    const profitData = sales.map(sale => {
      let totalRevenue = 0;
      let totalCost = 0;
      
      const items = sale.SaleItems.map(item => {
        const revenue = item.quantity * item.unit_price;
        const latestPurchaseItem = item.Product?.PurchaseItems?.[0];
        const costPrice = latestPurchaseItem ? latestPurchaseItem.cost_price : 0;
        const cost = item.quantity * costPrice;
        const profit = revenue - cost;
        
        totalRevenue += revenue;
        totalCost += cost;
        
        return {
          product_name: item.Product?.name || 'N/A',
          quantity: item.quantity,
          unit_price: item.unit_price,
          cost_price: costPrice,
          revenue,
          cost,
          profit,
          profit_margin: revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : 0
        };
      });
      
      const totalProfit = totalRevenue - totalCost;
      
      return {
        sale_id: sale.id,
        sale_date: sale.sale_date,
        customer: sale.Customer?.name || 'Walk-in',
        items,
        total_revenue: totalRevenue,
        total_cost: totalCost,
        total_profit: totalProfit,
        profit_margin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0
      };
    });
    
    // Calculate summary
    const summary = {
      total_sales: sales.length,
      total_revenue: profitData.reduce((sum, sale) => sum + sale.total_revenue, 0),
      total_cost: profitData.reduce((sum, sale) => sum + sale.total_cost, 0),
      total_profit: profitData.reduce((sum, sale) => sum + sale.total_profit, 0)
    };
    
    summary.overall_profit_margin = summary.total_revenue > 0 ? 
      ((summary.total_profit / summary.total_revenue) * 100).toFixed(2) : 0;
    
    res.status(200).json({
      success: true,
      summary,
      data: profitData
    });
  } catch (error) {
    console.error('Error fetching profit report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profit report',
      error: error.message
    });
  }
};

module.exports = {
  showImport,
  exportImportReportExcel,
  exportImportReportPDF,
  exportSalesReportExcel,
  exportSalesReportPDF,
  showProfitReport
};