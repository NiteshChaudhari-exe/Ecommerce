/**
 * Inventory Log Helper
 * Centralized function to log all inventory changes with consistent audit trail
 */

const InventoryLog = require('../models/InventoryLog');

/**
 * Log an inventory change
 * @param {Object} options
 *   @param {string} options.productId - Product being changed
 *   @param {number} options.quantity - Change in quantity (negative for decrease)
 *   @param {string} options.reason - one of: 'order_created', 'order_cancelled', 'order_deleted', 'manual_adjustment'
 *   @param {string} options.orderId - Order ID associated with the change
 *   @param {string} options.userId - User who initiated the change
 *   @param {number} options.previousStock - Stock before change
 *   @param {number} options.newStock - Stock after change
 *   @param {string} options.notes - Optional notes
 *   @param {Object} options.session - Optional mongoose session for transaction
 * @returns {Promise<InventoryLog>}
 */
async function logInventoryChange(options) {
  const {
    productId,
    quantity,
    reason,
    orderId,
    userId,
    previousStock,
    newStock,
    notes,
    session
  } = options;

  const logEntry = new InventoryLog({
    product: productId,
    quantity,
    reason,
    orderId,
    user: userId,
    previousStock,
    newStock,
    notes
  });

  if (session) {
    await logEntry.save({ session });
  } else {
    await logEntry.save();
  }

  return logEntry;
}

module.exports = { logInventoryChange };
