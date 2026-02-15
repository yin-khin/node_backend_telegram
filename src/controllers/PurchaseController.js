const db = require('../models');
const Purchase = db.Purchase;
const Supplier = db.Supplier;
const PurchaseItem = db.PurchaseItem;

const getAllPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findAll({
      include: [
        { model: Supplier, as: "Supplier" },
        { model: PurchaseItem, as: 'PurchaseItems' }
      ],
    });
    res.status(200).json({
      message: "show all purchase",
      purchase,
    });
  } catch (e) {
    res.status(500).json({
      message: "error purchase",
      error: e.message,
    });
  }
};

const getByIDPurchase = async (req, res) => {
  const { id } = req.params;
  try {
    const purchase = await Purchase.findByPk(id, {
      include: [
        { model: Supplier, as: "Supplier" },
        { model: PurchaseItem, as: 'PurchaseItems' }
      ],
    });
    res.status(200).json({
      message: "show by id purchase",
      purchase,
    });
  } catch (e) {
    res.status(500).json({
      message: "error purchase by ID",
      error: e.message,
    });
  }
};

const createPurchase = async (req, res) => {
  try {
    const { supplier_id, total, paid, balance } = req.body;
    const purchase = await Purchase.create({
      supplier_id,
      total,
      paid,
      balance,
    });
    
    res.status(200).json({
      message: "insert purchase successful",
      purchase,
    });
  } catch (e) {
    res.status(500).json({
      message: "error purchase",
      error: e.message,
    });
  }
};
const updatePurchase = async (req, res) => {
  const { id } = req.params;
  const { supplier_id, total, paid, balance } = req.body;
  try {
    const purchase = await Purchase.findByPk(id);
    await purchase.update({ supplier_id, total, paid, balance });
    res.status(200).json({
      message: "update purchase successful",
      purchase,
    });
  } catch (e) {
    res.status(500).json({
      message: "error purchase please check",
      error: e.message,
    });
  }
};

const deletePurchase = async (req, res) => {
  const { id } = req.params;
  try {
    const purchase = await Purchase.findByPk(id);
    await purchase.destroy();
    res.status(200).json({
      message: "delete purchase successful",
      purchase,
    });
  } catch (e) {
    res.status(500).json({
      message: "error purchase ",
      error: e.message,
    });
  }
};

module.exports = {
  getAllPurchase,
  getByIDPurchase,
  createPurchase,
  updatePurchase,
  deletePurchase,
};
