/**
 * Stock Reservation Service
 * Manages hold/release of inventory during checkout
 */

const Product = require('../models/Product');

/**
 * Calculate available stock (total stock minus reserved quantities)
 * @param {string} productId - Product ID
 * @returns {Promise<number>} Available stock
 */
async function getAvailableStock(productId) {
  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');

  // Remove expired reservations first
  product.reservations = product.reservations.filter(r => r.expiresAt > new Date());
  await product.save();

  // Calculate reserved quantity
  const reserved = product.reservations.reduce((sum, r) => sum + r.quantity, 0);

  return {
    total: product.stock,
    reserved,
    available: product.stock - reserved
  };
}

/**
 * Reserve stock for a user (creates a hold)
 * @param {string} productId - Product ID
 * @param {string} userId - User ID
 * @param {number} quantity - Quantity to reserve
 * @param {number} durationMinutes - How long to hold (default 15 minutes)
 * @returns {Promise<Object>} Reservation details
 */
async function reserveStock(productId, userId, quantity, durationMinutes = 15) {
  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');

  // Remove expired reservations
  product.reservations = product.reservations.filter(r => r.expiresAt > new Date());

  // Check available stock
  const reserved = product.reservations.reduce((sum, r) => sum + r.quantity, 0);
  const available = product.stock - reserved;

  if (available < quantity) {
    throw new Error(`Insufficient available stock. Available: ${available}, Requested: ${quantity}`);
  }

  // Check if user already has a reservation for this product
  const existingReservation = product.reservations.find(r => r.user?.toString() === userId);
  if (existingReservation) {
    // Update existing reservation
    existingReservation.quantity = quantity;
    existingReservation.expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
  } else {
    // Create new reservation
    product.reservations.push({
      user: userId,
      quantity,
      expiresAt: new Date(Date.now() + durationMinutes * 60 * 1000)
    });
  }

  await product.save();

  return {
    success: true,
    reservationId: productId,
    quantity,
    expiresAt: product.reservations.find(r => r.user?.toString() === userId).expiresAt
  };
}

/**
 * Release a reservation
 * @param {string} productId - Product ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Release details
 */
async function releaseReservation(productId, userId) {
  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');

  const initialCount = product.reservations.length;
  product.reservations = product.reservations.filter(
    r => r.user?.toString() !== userId
  );

  if (product.reservations.length === initialCount) {
    throw new Error('No reservation found for this user/product');
  }

  await product.save();

  return {
    success: true,
    message: 'Reservation released'
  };
}

/**
 * Confirm reservation (convert hold to actual stock reduction)
 * Called after successful payment
 * @param {string} productId - Product ID
 * @param {string} userId - User ID
 * @param {number} quantity - Quantity to confirm (should match reservation)
 * @returns {Promise<Object>} Confirmation details
 */
async function confirmReservation(productId, userId, quantity) {
  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');

  // Find and remove the reservation
  const reservationIndex = product.reservations.findIndex(
    r => r.user?.toString() === userId
  );

  if (reservationIndex === -1) {
    throw new Error('No reservation found');
  }

  const reservation = product.reservations[reservationIndex];
  if (reservation.quantity !== quantity) {
    throw new Error(`Reservation quantity (${reservation.quantity}) does not match confirmation (${quantity})`);
  }

  // Remove reservation
  product.reservations.splice(reservationIndex, 1);

  // Reduce actual stock
  product.stock -= quantity;

  if (product.stock < 0) {
    throw new Error('Insufficient stock after reservation confirmation');
  }

  await product.save();

  return {
    success: true,
    message: 'Reservation confirmed and stock reduced',
    newStock: product.stock
  };
}

/**
 * Clean up expired reservations (can be called periodically or via middleware)
 * @returns {Promise<number>} Number of reservations cleaned up
 */
async function cleanupExpiredReservations() {
  const result = await Product.updateMany(
    { 'reservations.expiresAt': { $lt: new Date() } },
    { $pull: { reservations: { expiresAt: { $lt: new Date() } } } }
  );

  return result.modifiedCount;
}

module.exports = {
  getAvailableStock,
  reserveStock,
  releaseReservation,
  confirmReservation,
  cleanupExpiredReservations
};
