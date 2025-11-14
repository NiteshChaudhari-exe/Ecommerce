const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true }, // positive = add, negative = subtract
  reason: { type: String, enum: ['order_created', 'order_cancelled', 'order_deleted', 'manual_adjustment', 'alert_low_stock'], required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // who initiated the change
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  notes: String,
  createdAt: { type: Date, default: Date.now, index: true }, // add index for queries
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
