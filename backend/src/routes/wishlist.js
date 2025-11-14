const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Product = require('../models/Product');
const mongoose = require('mongoose');

const router = express.Router();

// Get current user's wishlist (populated)
router.get('/', auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('wishlist');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Merge/add items to wishlist. Accepts { items: [productId, ...] }
router.post('/', auth(), async (req, res) => {
  try {
    const { items } = req.body; // array of product ids (strings)
    if (!Array.isArray(items)) return res.status(400).json({ message: 'Invalid items' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const validIds = items
      .filter((id) => mongoose.isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    // Add unique ids
    const current = new Set((user.wishlist || []).map((id) => id.toString()));
    validIds.forEach((id) => {
      if (!current.has(id.toString())) {
        user.wishlist.push(id);
        current.add(id.toString());
      }
    });

    await user.save();
    await user.populate('wishlist');
    res.json({ wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove item from wishlist
router.delete('/:productId', auth(), async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.wishlist = (user.wishlist || []).filter((id) => id.toString() !== productId);
    await user.save();
    await user.populate('wishlist');
    res.json({ wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
