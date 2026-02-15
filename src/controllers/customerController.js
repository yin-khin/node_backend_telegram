// customerController.js
const db = require('../models');
const Customer = db.Customer;

// Create a new customer
const createCustomer = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const newCustomer = await Customer.create({
      name,
      phone,
      address,
    });
    res
      .status(201)
      .json({
        message: "Customer created successfully",
        customer: newCustomer,
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error creating customer", error: error.message });
  }
};

// Get all customers
const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll();
    res.status(200).json(customers);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error fetching customers", error: error.message });
  }
};

// Get a single customer by ID
const getCustomerById = async (req, res) => {
  const { id } = req.params;
  try {
    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json(customer);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error fetching customer", error: error.message });
  }
};

// Update a customer by ID
const updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { name, phone, address } = req.body;
  try {
    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    await customer.update({ name, phone, address });
    res
      .status(200)
      .json({ message: "Customer updated successfully", customer });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error updating customer", error: error.message });
  }
};

// Delete a customer by ID
const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    await customer.destroy();
    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error deleting customer", error: error.message });
  }
};

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};
