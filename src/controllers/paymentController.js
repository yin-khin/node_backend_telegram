const db = require('../models');
const Payment = db.Payment;
const Sale = db.Sale;

// Get all payments
const getPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: [
        { 
          model: Sale,
          as: "Sale",
          attributes: ['id', 'total', 'sale_date']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.status(200).json({
      success: true,
      message: "Payments retrieved successfully",
      count: payments.length,
      data: payments,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Error retrieving payments",
      error: e.message,
    });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findByPk(id, {
      include: [
        { 
          model: Sale,
          as: "Sale",
          attributes: ['id', 'total', 'sale_date']
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment retrieved successfully",
      data: payment,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Error retrieving payment",
      error: e.message,
    });
  }
};

// Create new payment
const createPayment = async (req, res) => {
  try {
    const { sale_id, amount, method } = req.body;
    
    // Validate required fields
    if (!amount || !method) {
      return res.status(400).json({
        success: false,
        message: "Amount and method are required",
      });
    }

    // Validate method
    const validMethods = ['cash', 'credit_card', 'bank_transfer'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method. Must be: cash, credit_card, or bank_transfer",
      });
    }

    // If sale_id is provided, validate it exists and update sale balance
    let sale = null;
    if (sale_id) {
      sale = await Sale.findByPk(sale_id);
      if (!sale) {
        return res.status(404).json({
          success: false,
          message: "Sale not found",
        });
      }
    }

    const payment = await Payment.create({
      sale_id: sale_id || null,
      amount,
      method
    });

    // Update sale balance and paid amount if sale_id is provided
    if (sale_id && sale) {
      const newPaidAmount = parseFloat(sale.paid || 0) + parseFloat(amount);
      const newBalance = parseFloat(sale.total) - newPaidAmount;
      
      await sale.update({
        paid: newPaidAmount,
        balance: newBalance
      });
    }

    // Fetch the complete payment with associations
    const completePayment = await Payment.findByPk(payment.id, {
      include: [
        { 
          model: Sale,
          as: "Sale"
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: "Payment created successfully - sale balance updated",
      data: completePayment
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Error creating payment",
      error: e.message,
    });
  }
};

// Update payment
const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { sale_id, amount, method } = req.body;

    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Get old values
    const oldSaleId = payment.sale_id;
    const oldAmount = parseFloat(payment.amount || 0);

    // Validate method if provided
    if (method) {
      const validMethods = ['cash', 'credit_card', 'bank_transfer'];
      if (!validMethods.includes(method)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment method. Must be: cash, credit_card, or bank_transfer",
        });
      }
    }

    // If sale_id is provided, validate it exists
    let newSale = null;
    if (sale_id) {
      newSale = await Sale.findByPk(sale_id);
      if (!newSale) {
        return res.status(404).json({
          success: false,
          message: "Sale not found",
        });
      }
    }

    // Update payment
    await payment.update({
      sale_id: sale_id !== undefined ? sale_id : payment.sale_id,
      amount: amount !== undefined ? amount : payment.amount,
      method: method !== undefined ? method : payment.method
    });

    // Update sale balances
    const newAmount = parseFloat(amount !== undefined ? amount : payment.amount);
    
    // If old sale exists, subtract old amount
    if (oldSaleId) {
      const oldSale = await Sale.findByPk(oldSaleId);
      if (oldSale) {
        const oldSalePaid = parseFloat(oldSale.paid || 0) - oldAmount;
        const oldSaleBalance = parseFloat(oldSale.total) - oldSalePaid;
        await oldSale.update({
          paid: oldSalePaid,
          balance: oldSaleBalance
        });
      }
    }

    // If new sale exists, add new amount
    const finalSaleId = sale_id !== undefined ? sale_id : payment.sale_id;
    if (finalSaleId) {
      const currentSale = await Sale.findByPk(finalSaleId);
      if (currentSale) {
        const newSalePaid = parseFloat(currentSale.paid || 0) + newAmount;
        const newSaleBalance = parseFloat(currentSale.total) - newSalePaid;
        await currentSale.update({
          paid: newSalePaid,
          balance: newSaleBalance
        });
      }
    }

    const updatedPayment = await Payment.findByPk(id, {
      include: [
        { 
          model: Sale,
          as: "Sale"
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: "Payment updated successfully - sale balance updated",
      data: updatedPayment,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Error updating payment",
      error: e.message,
    });
  }
};

// Delete payment
const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Get payment details before deletion
    const saleId = payment.sale_id;
    const amount = parseFloat(payment.amount || 0);

    // If payment is linked to a sale, update sale balance
    if (saleId) {
      const sale = await Sale.findByPk(saleId);
      if (sale) {
        const newPaidAmount = parseFloat(sale.paid || 0) - amount;
        const newBalance = parseFloat(sale.total) - newPaidAmount;
        await sale.update({
          paid: newPaidAmount,
          balance: newBalance
        });
      }
    }

    await payment.destroy();

    res.status(200).json({
      success: true,
      message: "Payment deleted successfully - sale balance updated",
      data: { id: parseInt(id) },
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Error deleting payment",
      error: e.message,
    });
  }
};

module.exports = {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
};