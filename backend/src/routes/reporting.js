const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

const router = express.Router();

// Sales report (admin/manager)
router.get('/sales', auth(['admin', 'manager']), async (req, res) => {
  try {
    const sales = await Order.aggregate([
      { $group: { _id: '$status', total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]);
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Inventory report (admin/manager)
router.get('/inventory', auth(['admin', 'manager']), async (req, res) => {
  try {
    const inventory = await Product.find({}, 'name stock');
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
