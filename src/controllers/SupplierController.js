const db = require("../models");
const Supplier = db.Supplier;
const getAllSupplier = async (req, res) => {
  try {
    const suppliers = await Supplier.findAll();
    res.status(200).json({
      message: "Suppliers retrieved successfully",
      suppliers,
    });
  } catch (e) {
    res.status(500).json({
      message: "Error retrieving suppliers",
      error: e.message,
    });
  }
};
const getSupplierById = async(req ,res)=>{
    const {id}= req.params;
    try{
        const supplier = await Supplier.findByPk(id);
        if (!supplier) {
            return res.status(404).json({
                message: "Supplier not found"
            });
        }
        res.status(200).json({
            message:"Supplier found by ID",
            supplier,
        })
    }catch(e){
        res.status(500).json({
            message:'error supplier find',error:e.message,
        })
    }
}
const createSupplier = async (req, res) => {
  try {
    const { name, phone_first, phone_second, address ,status ,telegram_chat_id} = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        message: "Name is required"
      });
    }

    const newSupplier = await Supplier.create({
      name,
      phone_first,
      phone_second,
      address,
      status,
      telegram_chat_id,

    });
    res.status(201).json({
        message:"create supplier success",
        newSupplier,
    });
  } catch (e) {
    res.status(500).json({
        message:"error supplier create",error:e.message,
    });
  }
};

const updateSupplier = async (req , res)=>{
    const {id}= req.params;
    const {name , phone_first , phone_second , address,status,telegram_chat_id} = req.body;
    try{
        const supplier = await Supplier.findByPk(id);
        if (!supplier) {
            return res.status(404).json({
                message: "Supplier not found"
            });
        }
        await supplier.update({name , phone_first , phone_second , address,status,telegram_chat_id});
        res.status(200).json({
            message:'update supplier success',
            supplier,
        });
    }catch(e){
        res.status(500).json({
            message:"error update supplier",error:e.message,
        });
    }
}

const deleteSupplier = async(req  ,res)=>{
    const {id}=req.params;
    try{
        const supplier = await Supplier.findByPk(id);
        if (!supplier) {
            return res.status(404).json({
                message: "Supplier not found"
            });
        }
        await supplier.destroy();
        res.status(200).json({
            message:"delete supplier success",
            supplier,
        });
    }catch(e){
        res.status(500).json({
            message:"error delete supplier",error:e.message,
        });
    }
}

module.exports = {
  getAllSupplier,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};

// const db = require("../models");
// const Supplier = db.Supplier;

// const getAllSupplier = async (req, res) => {
//   try {
//     const suppliers = await Supplier.findAll({
//       attributes: [
//         "id",
//         "name",
//         "phone_first",
//         "phone_second",
//         "address",
//         "telegram_chat_id",
//       ],
//       order: [["id", "DESC"]],
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Suppliers retrieved successfully",
//       data: suppliers,
//     });
//   } catch (e) {
//     return res.status(500).json({
//       success: false,
//       message: "Error retrieving suppliers",
//       error: e.message,
//     });
//   }
// };

// const getSupplierById = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const supplier = await Supplier.findByPk(id, {
//       attributes: [
//         "id",
//         "name",
//         "phone_first",
//         "phone_second",
//         "address",
//         "telegram_chat_id",
//       ],
//     });

//     if (!supplier) {
//       return res.status(404).json({
//         success: false,
//         message: "Supplier not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Supplier found by ID",
//       data: supplier,
//     });
//   } catch (e) {
//     return res.status(500).json({
//       success: false,
//       message: "Error supplier find",
//       error: e.message,
//     });
//   }
// };

// const createSupplier = async (req, res) => {
//   try {
//     const { name, phone_first, phone_second, address, telegram_chat_id } =
//       req.body;

//     if (!name) {
//       return res.status(400).json({
//         success: false,
//         message: "Name is required",
//       });
//     }

//     const newSupplier = await Supplier.create({
//       name,
//       phone_first,
//       phone_second,
//       address,
//       telegram_chat_id: telegram_chat_id ? String(telegram_chat_id) : null, // or Number()
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Create supplier success",
//       data: newSupplier,
//     });
//   } catch (e) {
//     return res.status(500).json({
//       success: false,
//       message: "Error supplier create",
//       error: e.message,
//     });
//   }
// };

// const updateSupplier = async (req, res) => {
//   const { id } = req.params;
//   const { name, phone_first, phone_second, address, telegram_chat_id } =
//     req.body;

//   try {
//     const supplier = await Supplier.findByPk(id);
//     if (!supplier) {
//       return res.status(404).json({
//         success: false,
//         message: "Supplier not found",
//       });
//     }

//     await supplier.update({
//       name,
//       phone_first,
//       phone_second,
//       address,
//       telegram_chat_id:
//         telegram_chat_id !== undefined
//           ? String(telegram_chat_id)
//           : supplier.telegram_chat_id,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Update supplier success",
//       data: supplier,
//     });
//   } catch (e) {
//     return res.status(500).json({
//       success: false,
//       message: "Error update supplier",
//       error: e.message,
//     });
//   }
// };

// const deleteSupplier = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const supplier = await Supplier.findByPk(id);
//     if (!supplier) {
//       return res.status(404).json({
//         success: false,
//         message: "Supplier not found",
//       });
//     }

//     await supplier.destroy();

//     return res.status(200).json({
//       success: true,
//       message: "Delete supplier success",
//       data: supplier,
//     });
//   } catch (e) {
//     return res.status(500).json({
//       success: false,
//       message: "Error delete supplier",
//       error: e.message,
//     });
//   }
// };

// module.exports = {
//   getAllSupplier,
//   getSupplierById,
//   createSupplier,
//   updateSupplier,
//   deleteSupplier,
// };
