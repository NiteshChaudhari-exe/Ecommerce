const express = require('express');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Dashboard metrics (admin/manager)
router.get('/metrics', auth(['admin', 'manager']), async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();
    const lowStock = await Product.find({ stock: { $lt: 10 } });
    res.json({
      totalProducts,
      totalOrders,
      totalUsers,
      lowStock
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
