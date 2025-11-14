/**
 * Low Stock Alert Service
 * Monitors products and alerts admins when stock falls below reorderLevel
 */

const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');

/**
 * Check if a product's stock has fallen below reorder level
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Alert details
 */
async function checkProductStock(productId) {
  const product = await Product.findById(productId).lean();
  if (!product) throw new Error('Product not found');

  const available = product.stock - (product.reservations?.reduce((sum, r) => sum + r.quantity, 0) || 0);
  const isLowStock = available <= product.reorderLevel;

  return {
    productId,
    name: product.name,
    stock: product.stock,
    available,
    reorderLevel: product.reorderLevel,
    isLowStock,
    percentageRemaining: Math.round((available / product.stock) * 100)
  };
}

/**
 * Get all products with low stock
 * @returns {Promise<Array>} Array of low-stock products
 */
async function getLowStockProducts() {
  const products = await Product.find({ stock: { $exists: true } }).lean();
  
  const lowStock = products
    .map(p => ({
      productId: p._id,
      name: p.name,
      stock: p.stock,
      available: p.stock - (p.reservations?.reduce((sum, r) => sum + r.quantity, 0) || 0),
      reorderLevel: p.reorderLevel,
      isLowStock: (p.stock - (p.reservations?.reduce((sum, r) => sum + r.quantity, 0) || 0)) <= p.reorderLevel,
      percentageRemaining: Math.round((p.stock / (p.stock + 1)) * 100)
    }))
    .filter(p => p.isLowStock);

  return lowStock;
}

/**
 * Create a low-stock alert log
 * @param {Object} options
 *   @param {string} options.productId - Product being alerted
 *   @param {number} options.stock - Current stock
 *   @param {number} options.available - Available (after reservations)
 *   @param {number} options.reorderLevel - Threshold
 *   @param {string} options.reason - Why alert was triggered
 * @returns {Promise<Object>} Alert log
 */
async function createLowStockAlert(options) {
  const {
    productId,
    stock,
    available,
    reorderLevel,
    reason = 'stock_below_threshold'
  } = options;

  // Create a special inventory log entry for the alert
  const alertLog = new InventoryLog({
    product: productId,
    quantity: 0, // No actual change, just an alert
    reason: 'alert_low_stock',
    previousStock: stock,
    newStock: stock,
    notes: `Low stock alert: Available=${available}, Threshold=${reorderLevel}`
  });

  await alertLog.save();
  return alertLog;
}

/**
 * Check stock and create alerts for products below threshold
 * Can be run on a schedule (e.g., hourly)
 * @returns {Promise<Array>} Array of products that triggered alerts
 */
async function checkAllProductsAndAlert() {
  const lowStockProducts = await getLowStockProducts();
  const alerts = [];

  for (const product of lowStockProducts) {
    const alertLog = await createLowStockAlert({
      productId: product.productId,
      stock: product.stock,
      available: product.available,
      reorderLevel: product.reorderLevel
    });

    alerts.push({
      productId: product.productId,
      name: product.name,
      available: product.available,
      reorderLevel: product.reorderLevel,
      alertId: alertLog._id,
      alertTime: alertLog.createdAt
    });
  }

  return alerts;
}

module.exports = {
  checkProductStock,
  getLowStockProducts,
  createLowStockAlert,
  checkAllProductsAndAlert
};
