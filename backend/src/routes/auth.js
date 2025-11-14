const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, wishlist } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    // If client provided wishlist items (guest wishlist), merge them into user's wishlist
    if (Array.isArray(wishlist) && wishlist.length) {
    const mongoose = require('mongoose');
    const validIds = wishlist.filter((id) => mongoose.isValidObjectId(id)).map((id) => new mongoose.Types.ObjectId(id));
    const current = new Set((user.wishlist || []).map((id) => id.toString()));
    validIds.forEach((id) => {
      if (!current.has(id.toString())) user.wishlist.push(id);
    });
    await user.save();
    await user.populate('wishlist');
    }

    const responseUser = { id: user._id, username: user.username, email: user.email, role: user.role };
    res.json({ token, user: responseUser, wishlist: user.wishlist || [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
