const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number, required: true }
    }
  ],
  total: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'cancelled'], default: 'pending' },
  useReservation: { type: Boolean, default: false }, // true if reservations were used/confirmed
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
