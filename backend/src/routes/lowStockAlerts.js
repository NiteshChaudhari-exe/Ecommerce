const express = require('express');
const auth = require('../middleware/auth');
const {
  checkProductStock,
  getLowStockProducts,
  checkAllProductsAndAlert
} = require('../services/lowStockAlertService');

const router = express.Router();

/**
 * GET /api/low-stock-alerts/products
 * Get all products currently with low stock
 */
router.get('/products', auth(['admin', 'manager']), async (req, res) => {
  try {
    const lowStockProducts = await getLowStockProducts();
    res.json({
      count: lowStockProducts.length,
      products: lowStockProducts
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/low-stock-alerts/product/:productId
 * Check stock status for a specific product
 */
router.get('/product/:productId', auth(['admin', 'manager']), async (req, res) => {
  try {
    const status = await checkProductStock(req.params.productId);
    res.json(status);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * POST /api/low-stock-alerts/check-all
 * Admin: Check all products and create alerts for low-stock items
 * This should be called periodically (hourly cron job)
 */
router.post('/check-all', auth(['admin']), async (req, res) => {
  try {
    const alerts = await checkAllProductsAndAlert();
    res.json({
      message: `Checked all products. ${alerts.length} low-stock alerts created.`,
      alertsTriggered: alerts.length,
      alerts
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
