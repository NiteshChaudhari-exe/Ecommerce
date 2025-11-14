const express = require('express');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

const router = express.Router();

// Low stock notifications (admin/manager/employee)
router.get('/low-stock', auth(['admin', 'manager', 'employee']), async (req, res) => {
  try {
    const lowStock = await Product.find({ stock: { $lt: 10 } });
    res.json(lowStock);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
