const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  reservations: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      quantity: { type: Number, required: true },
      expiresAt: { type: Date, required: true, index: true }, // TTL index for auto-cleanup
      createdAt: { type: Date, default: Date.now }
    }
  ],
  reorderLevel: { type: Number, default: 10 }, // threshold for low-stock alerts
  category: String,
  imageUrl: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
