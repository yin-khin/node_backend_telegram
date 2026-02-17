// const { Op } = require("sequelize");
// const db = require("../models");
// const Brand = db.Brand;
// const Category = db.Category;
// const Product = db.Product;
// const Supplier = db.Supplier;
// const NotificationService = require("../services/notificationService");

// // Make sure models are loaded
// if (!Product) {
//   console.error("Product model not loaded");
// }
// if (!Brand) {
//   console.error("Brand model not loaded");
// }
// if (!Category) {
//   console.error("Category model not loaded");
// }
// if (!Supplier) {
//   console.error("Supplier model not loaded");
// }

// const getAllProduct = async (req, res) => {
//   try {
//     // Check if models are loaded
//     if (!Product || !Brand || !Category || !Supplier) {
//       return res.status(500).json({
//         success: false,
//         message: "Models not properly loaded",
//         error: {
//           product: !Product,
//           brand: !Brand,
//           category: !Category,
//           supplier: !Supplier,
//         },
//       });
//     }

//     const { search, category_id, brand_id, supplier_id, status, page, limit } =
//       req.query;
//     // const products = await Product.findAll();
//     // Build where clause for filtering
//     const where = {};

//     // Search filter (by name or barcode)
//     if (search) {
//       where[Op.or] = [
//         { name: { [Op.like]: `%${search}%` } },
//         { barcode: { [Op.like]: `%${search}%` } },
//       ];
//     }

//     // Category filter
//     if (category_id) {
//       where.category_id = parseInt(category_id);
//     }

//     // Brand filter
//     if (brand_id) {
//       where.brand_id = parseInt(brand_id);
//     }

//     // Supplier filter
//     if (supplier_id) {
//       where.supplier_id = parseInt(supplier_id);
//     }

//     // Status filter
//     if (status !== undefined && status !== "") {
//       where.status = parseInt(status);
//     }

//     // Pagination
//     const pageNum = parseInt(page) || 1;
//     // const limitNum = parseInt(limit) || 30;
//     const offset = (pageNum - 1) * limitNum;

//     const { count, rows: product } = await Product.findAndCountAll({
//       where,
//       include: [
//         {
//           model: Brand,
//           as: "Brand",
//           attributes: ["id", "name", "image", "status"],
//         },
//         {
//           model: Category,
//           as: "Category",
//           attributes: ["id", "name", "image", "status"],
//         },
//         {
//           model: Supplier,
//           as: "Supplier",
//           attributes: ["id", "name", "phone_first", "address"],
//         },
//       ],
//       limit: limitNum,
//       offset: offset,
//       order: [["id", "DESC"]],
//     });

//     res.status(200).json({
//       message: "show product all successfully",
//       product,
//       // products,
//       total: count,
//       page: pageNum,
//       limit: limitNum,
//       totalPages: Math.ceil(count / limitNum),
//     });
//   } catch (e) {
//     console.error("Error fetching products:", e);
//     res.status(500).json({
//       message: "error not fount product",
//       error: e.message,
//     });
//   }
// };

// const getProductById = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const product = await Product.findByPk(id, {
//       include: [
//         { model: Brand, as: "Brand" },
//         { model: Category, as: "Category" },
//         { model: Supplier, as: "Supplier" },
//       ],
//     });
//     if (product) {
//       res.status(200).json(product);
//     } else {
//       res.status(404).json({ message: "Product not found" });
//     }
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ message: "Error retrieving product", error: error.message });
//   }
// };

// // const createProduct = async (req, res) => {
// //   try {
// //     const {
// //       name,
// //       category_id,
// //       brand_id,
// //       supplier_id,
// //       price,
// //       sale_price,
// //       qty,
// //       barcode,
// //       image,
// //       status,
// //       expire_date,
// //     } = req.body;
// //     const newProduct = await Product.create({
// //       name,
// //       category_id,
// //       brand_id,
// //       supplier_id,
// //       price,
// //       sale_price,
// //       qty,
// //       barcode,
// //       image,
// //       status,
// //       expire_date,
// //     });

// //     // Check stock levels for the new product
// //     try {
// //       await NotificationService.checkProductStockLevel(newProduct.id);
// //     } catch (notificationError) {
// //       console.error(
// //         "Error checking stock levels for new product:",
// //         notificationError,
// //       );
// //       // Don't fail the product creation if notification fails
// //     }

// //     res.status(200).json({
// //       message: "product create successful",
// //       newProduct,
// //     });
// //   } catch (e) {
// //     res.status(500).json({
// //       message: "error for create product",
// //       error: e.message,
// //     });
// //   }
// // };

// const createProduct = async (req, res) => {
//   try {
//     const {
//       name,
//       category_id,
//       brand_id,
//       supplier_id,
//       price,
//       sale_price,
//       qty,
//       barcode,
//       image,
//       status,
//       expire_date,
//     } = req.body;

//     const newProduct = await Product.create({
//       name,
//       category_id,
//       brand_id,
//       supplier_id,
//       price,
//       sale_price,
//       qty: Number(qty || 0), // ✅ ensure number
//       barcode,
//       image,
//       status,
//       expire_date,
//     });

//     // ✅ trigger stock check (will create notification + send telegram to Supplier)
//     NotificationService.checkProductStockLevel(newProduct.id).catch((err) =>
//       console.error("Stock check (create) error:", err),
//     );

//     return res.status(200).json({
//       success: true,
//       message: "product create successful",
//       data: newProduct,
//     });
//   } catch (e) {
//     return res.status(500).json({
//       success: false,
//       message: "error for create product",
//       error: e.message,
//     });
//   }
// };

// // const updateProduct = async (req, res) => {
// //   // const { id } = req.params;
// //   // const {
// //   //   name,
// //   //   category_id,
// //   //   brand_id,
// //   //   price,
// //   //   sale_price,
// //   //   qty,
// //   //   barcode,
// //   //   image,
// //   //   status,
// //   //   expire_date,
// //   // } = req.body;

// //   // try {
// //   //   const product = await Product.findByPk(id);
// //   //   if (!product) {
// //   //     return res.status(404).json({
// //   //       message: "Product not found",
// //   //     });
// //   //   }

// //   //   const oldQty = product.qty;

// //   //   await product.update({
// //   //     name,
// //   //     category_id,
// //   //     brand_id,
// //   //     price,
// //   //     sale_price,
// //   //     qty,
// //   //     barcode,
// //   //     image,
// //   //     status,
// //   //     expire_date,
// //   //   });

// //   //   // Check stock levels if quantity changed
// //   //   if (oldQty !== qty) {
// //   //     try {
// //   //       await NotificationService.checkProductStockLevel(product.id);
// //   //       console.log(`📊 Stock level checked for product ${product.name}: ${oldQty} → ${qty}`);
// //   //     } catch (notificationError) {
// //   //       console.error('Error checking stock levels after product update:', notificationError);
// //   //       // Don't fail the product update if notification fails
// //   //     }
// //   //   }

// //   //   res.status(200).json({
// //   //     message: "update product successful",
// //   //     product,
// //   //   });
// //   // } catch (e) {
// //   //   res.status(500).json({
// //   //     message: "error is not update product",
// //   //     error: e.message,
// //   //   });
// //   // }
// //   const { id } = req.params;
// //   const {
// //     name,
// //     category_id,
// //     brand_id,
// //     supplier_id,
// //     price,
// //     sale_price,
// //     qty,

// //     barcode,
// //     image,
// //     status,
// //     expire_date,
// //   } = req.body;

// //   try {
// //     const product = await Product.findByPk(id);
// //     if (!product) {
// //       return res.status(404).json({
// //         message: "Product not found",
// //       });
// //     }

// //     // const oldQty = product.qty;
// //     const oldQty = Number(product.qty || 0);
// //     const newQty = qty !== undefined ? Number(qty) : oldQty;
// //     await product.update({
// //       name,
// //       category_id,
// //       brand_id,
// //       supplier_id,
// //       price,
// //       sale_price,
// //       // qty,
// //       qty: newQty,
// //       barcode,
// //       image,
// //       status,
// //       expire_date,
// //     });

// //     // Check stock levels if quantity changed
// //     if (oldQty !== qty) {
// //       try {
// //         // 1. Check for new notifications if stock is low
// //         await NotificationService.checkProductStockLevel(product.id);
// //         await NotificationService.checkProductStockLevel(product.id);
// //         // 2. RESOLVE/ARCHIVE old notifications if stock is restored
// //         await NotificationService.resolveOutdatedNotifications(
// //           product.id,
// //           oldQty,
// //           qty,
// //         );

// //         console.log(
// //           ` Stock level checked for product ${product.name}: ${oldQty} → ${qty}`,
// //         );
// //       } catch (notificationError) {
// //         console.error(
// //           "Error checking stock levels after product update:",
// //           notificationError,
// //         );
// //         // Don't fail the product update if notification fails
// //       }
// //     }

// //     res.status(200).json({
// //       success: true,
// //       message: "បានធ្វើបច្ចុប្បន្នភាពផលិតផលដោយជោគជ័យ",
// //       data: product,
// //     });
// //   } catch (e) {
// //     res.status(500).json({
// //       success: false,
// //       message: "មិនអាចធ្វើបច្ចុប្បន្នភាពផលិតផលបាន",
// //       error: e.message,
// //     });
// //   }
// // };
// const updateProduct = async (req, res) => {
//   const { id } = req.params;
//   const {
//     name,
//     category_id,
//     brand_id,
//     supplier_id,
//     price,
//     sale_price,
//     qty,
//     barcode,
//     image,
//     status,
//     expire_date,
//   } = req.body;

//   try {
//     const product = await Product.findByPk(id);
//     if (!product) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Product not found" });
//     }

//     const oldQty = Number(product.qty || 0);
//     const newQty = qty !== undefined ? Number(qty) : oldQty; // ✅ ensure number

//     await product.update({
//       name,
//       category_id,
//       brand_id,
//       supplier_id,
//       price,
//       sale_price,
//       qty: newQty,
//       barcode,
//       image,
//       status,
//       expire_date,
//     });

//     // ✅ Trigger only when qty changed
//     if (oldQty !== newQty) {
//       // This will: create notification + send telegram to supplier (if registered)
//       NotificationService.checkProductStockLevel(product.id)
//         .then(() =>
//           console.log(
//             `📊 Stock checked: ${product.name} ${oldQty} → ${newQty}`,
//           ),
//         )
//         .catch((err) => console.error("Stock check (update) error:", err));
//     }

//     return res.status(200).json({
//       success: true,
//       message: "បានធ្វើបច្ចុប្បន្នភាពផលិតផលដោយជោគជ័យ",
//       data: product,
//     });
//   } catch (e) {
//     return res.status(500).json({
//       success: false,
//       message: "មិនអាចធ្វើបច្ចុប្បន្នភាពផលិតផលបាន",
//       error: e.message,
//     });
//   }
// };

// const deleteProduct = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const product = await Product.findByPk(id, {
//       include: [
//         { model: Brand, as: "Brand" },
//         { model: Category, as: "Category" },
//         { model: Supplier, as: "Supplier" },
//       ],
//     });
//     await product.destroy();
//     res.status(200).json({
//       message: "delete product successful",
//       product,
//     });
//   } catch (e) {
//     res.status(500).json({
//       message: "error delete product",
//       error: e.message,
//     });
//   }
// };
// module.exports = {
//   getAllProduct,
//   createProduct,
//   getProductById,
//   updateProduct,
//   deleteProduct,
// };


const { Op } = require("sequelize");
const db = require('../models');
const Brand = db.Brand;
const Category = db.Category;
const Product = db.Product;
const Supplier = db.Supplier;
const NotificationService = require('../services/notificationService');

const getAllProduct = async (req, res) => {
  try {
    // Check if models are loaded
    if (!Product || !Brand || !Category || !Supplier) {
      return res.status(500).json({
        success: false,
        message: 'Models not properly loaded',
        error: {
          product: !Product,
          brand: !Brand,
          category: !Category,
          supplier: !Supplier
        }
      });
    }

    const { search, category_id, brand_id, supplier_id, status, page, limit } = req.query;
    // const products = await Product.findAll();
    // Build where clause for filtering
    const where = {};
    
    // Search filter (by name or barcode)
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { barcode: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Category filter
    if (category_id) {
      where.category_id = parseInt(category_id);
    }
    
    // Brand filter
    if (brand_id) {
      where.brand_id = parseInt(brand_id);
    }
    
    // Supplier filter
    if (supplier_id) {
      where.supplier_id = parseInt(supplier_id);
    }
    
    // Status filter
    if (status !== undefined && status !== '') {
      where.status = parseInt(status);
    }
    
    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 30;
    const offset = (pageNum - 1) * limitNum;
    
    const { count, rows: product } = await Product.findAndCountAll({
      where,
      include: [
        { model: Brand, as: "Brand", attributes: ["id", "name", "image", "status"] },
        { model: Category, as: "Category", attributes: ["id", "name", "image", "status"] },
        { model: Supplier, as: "Supplier", attributes: ["id", "name", "phone_first", "address"] },
      ],
      limit: limitNum,
      offset: offset,
      order: [['id', 'DESC']],
    });
    
    res.status(200).json({
      message: "show product all successfully",
      product,
      // products,
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(count / limitNum),
    });
  } catch (e) {
    console.error("Error fetching products:", e);
    res.status(500).json({
      message: "error not fount product",
      error: e.message,
    });
  }
};

const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findByPk(id,{
         include: [
           { model: Brand, as: "Brand" }, 
           { model: Category, as: "Category" },
           { model: Supplier, as: "Supplier" }
         ],
    });
    if (product) {
      res.status(200).json(product);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error retrieving product", error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const {
      name,
      category_id,
      brand_id,
      supplier_id,
      price,
      sale_price,
      qty,
      barcode,
      image,
      status,
      expire_date,
    } = req.body;
    const newProduct = await Product.create({
      name,
      category_id,
      brand_id,
      supplier_id,
      price,
      sale_price,
      qty,
      barcode,
      image,
      status,
      expire_date,
    });

    // Check stock levels for the new product
    try {
      await NotificationService.checkProductStockLevel(newProduct.id);
    } catch (notificationError) {
      console.error('Error checking stock levels for new product:', notificationError);
      // Don't fail the product creation if notification fails
    }

    res.status(200).json({
      message: "product create successful",
       newProduct,
    });
  } catch (e) {
    res.status(500).json({
      message: "error for create product",
      error: e.message,
    });
  }
};

const updateProduct = async (req, res) => {
  // const { id } = req.params;
  // const {
  //   name,
  //   category_id,
  //   brand_id,
  //   price,
  //   sale_price,
  //   qty,
  //   barcode,
  //   image,
  //   status,
  //   expire_date,
  // } = req.body;

  // try {
  //   const product = await Product.findByPk(id);
  //   if (!product) {
  //     return res.status(404).json({
  //       message: "Product not found",
  //     });
  //   }

  //   const oldQty = product.qty;
    
  //   await product.update({
  //     name,
  //     category_id,
  //     brand_id,
  //     price,
  //     sale_price,
  //     qty,
  //     barcode,
  //     image,
  //     status,
  //     expire_date,
  //   });

  //   // Check stock levels if quantity changed
  //   if (oldQty !== qty) {
  //     try {
  //       await NotificationService.checkProductStockLevel(product.id);
  //       console.log(`📊 Stock level checked for product ${product.name}: ${oldQty} → ${qty}`);
  //     } catch (notificationError) {
  //       console.error('Error checking stock levels after product update:', notificationError);
  //       // Don't fail the product update if notification fails
  //     }
  //   }

  //   res.status(200).json({
  //     message: "update product successful",
  //     product,
  //   });
  // } catch (e) {
  //   res.status(500).json({
  //     message: "error is not update product",
  //     error: e.message,
  //   });
  // }
   const { id } = req.params;
  const {
    name,
    category_id,
    brand_id,
    supplier_id,
    price,
    sale_price,
    qty,
    barcode,
    image,
    status,
    expire_date,
  } = req.body;

  try {
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const oldQty = product.qty;
    
    await product.update({
      name,
      category_id,
      brand_id,
      supplier_id,
      price,
      sale_price,
      qty,
      barcode,
      image,
      status,
      expire_date,
    });

    // Check stock levels if quantity changed
    if (oldQty !== qty) {
      try {
        // 1. Check for new notifications if stock is low
        await NotificationService.checkProductStockLevel(product.id);
        
        // 2. RESOLVE/ARCHIVE old notifications if stock is restored
        await NotificationService.resolveOutdatedNotifications(product.id, oldQty, qty);
        
        console.log(` Stock level checked for product ${product.name}: ${oldQty} → ${qty}`);
      } catch (notificationError) {
        console.error('Error checking stock levels after product update:', notificationError);
        // Don't fail the product update if notification fails
      }
    }

    res.status(200).json({
      success: true,
      message: "បានធ្វើបច្ចុប្បន្នភាពផលិតផលដោយជោគជ័យ",
      data: product,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "មិនអាចធ្វើបច្ចុប្បន្នភាពផលិតផលបាន",
      error: e.message,
    });
  }
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findByPk(id, {
      include: [
        { model: Brand, as: "Brand" }, 
        { model: Category, as: "Category" },
        { model: Supplier, as: "Supplier" }
      ],
    });
    await product.destroy();
    res.status(200).json({
      message: "delete product successful",
      product,
    });
  } catch (e) {
    res.status(500).json({
      message: "error delete product",
      error: e.message,
    });
  }
};
module.exports = {
  getAllProduct,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
};
