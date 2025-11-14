const express = require('express');
const InventoryLog = require('../models/InventoryLog');
const auth = require('../middleware/auth');

const router = express.Router();

// Get inventory logs (admin/manager only)
router.get('/', auth(['admin', 'manager']), async (req, res) => {
  try {
    const { productId, reason, orderId, startDate, endDate, limit = 50, skip = 0 } = req.query;
    const query = {};

    if (productId) query.product = productId;
    if (reason) query.reason = reason;
    if (orderId) query.orderId = orderId;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await InventoryLog.find(query)
      .populate('product', 'name sku')
      .populate('orderId', '_id status')
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await InventoryLog.countDocuments(query);

    res.json({ logs, total, limit: parseInt(limit), skip: parseInt(skip) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get inventory log by ID
router.get('/:id', auth(['admin', 'manager']), async (req, res) => {
  try {
    const log = await InventoryLog.findById(req.params.id)
      .populate('product')
      .populate('orderId')
      .populate('user');
    
    if (!log) return res.status(404).json({ message: 'Log not found' });
    
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get inventory summary for a product
router.get('/product/:productId/summary', auth(['admin', 'manager']), async (req, res) => {
  try {
    const { productId } = req.params;
    const logs = await InventoryLog.find({ product: productId })
      .sort({ createdAt: -1 })
      .limit(100);

    const summary = {
      productId,
      totalLogs: logs.length,
      reasons: {},
      totalQuantityChanged: 0,
      logs
    };

    logs.forEach(log => {
      summary.reasons[log.reason] = (summary.reasons[log.reason] || 0) + 1;
      summary.totalQuantityChanged += log.quantity;
    });

    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
