const express = require('express');
const auth = require('../middleware/auth');
const {
  getAvailableStock,
  reserveStock,
  releaseReservation,
  confirmReservation,
  cleanupExpiredReservations
} = require('../services/reservationService');

const router = express.Router();

/**
 * GET /api/reservations/product/:productId/available
 * Get available stock (total - reserved) for a product
 */
router.get('/product/:productId/available', async (req, res) => {
  try {
    const { productId } = req.params;
    const stock = await getAvailableStock(productId);
    res.json(stock);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * POST /api/reservations/reserve
 * Create/update a reservation for a product
 * Body: { productId, quantity, durationMinutes }
 */
router.post('/reserve', auth(), async (req, res) => {
  try {
    const { productId, quantity, durationMinutes = 15 } = req.body;
    const userId = req.user.id;

    if (!productId || !quantity) {
      return res.status(400).json({ message: 'productId and quantity required' });
    }

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const reservation = await reserveStock(productId, userId, quantity, durationMinutes);
    res.status(201).json(reservation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * POST /api/reservations/release
 * Release a reservation
 * Body: { productId }
 */
router.post('/release', auth(), async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    if (!productId) {
      return res.status(400).json({ message: 'productId required' });
    }

    const result = await releaseReservation(productId, userId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * POST /api/reservations/confirm
 * Confirm a reservation (convert to actual stock reduction)
 * Called after successful payment
 * Body: { productId, quantity }
 */
router.post('/confirm', auth(), async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    if (!productId || !quantity) {
      return res.status(400).json({ message: 'productId and quantity required' });
    }

    const result = await confirmReservation(productId, userId, quantity);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * POST /api/reservations/cleanup
 * Admin endpoint: clean up expired reservations
 */
router.post('/cleanup', auth(['admin', 'manager']), async (req, res) => {
  try {
    const count = await cleanupExpiredReservations();
    res.json({ message: `Cleaned up ${count} expired reservations` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
