const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const { logInventoryChange } = require('../services/inventoryLogger');
const { confirmReservation } = require('../services/reservationService');
const { createLowStockAlert } = require('../services/lowStockAlertService');
const { emitToAdmins } = require('../lib/socketManager');
const auth = require('../middleware/auth');

const router = express.Router();

// Get orders - user gets their own, admin/manager get all
router.get('/', auth(['employee', 'manager', 'admin']), async (req, res) => {
  try {
    let query = {};
    // If user is not admin/manager, filter by their user ID
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      query.user = req.user.id;
    }
    const orders = await Order.find(query).populate('user').populate('products.product');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create order (employee)
router.post('/', auth(['employee', 'manager', 'admin']), async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { products, total, useReservation = false } = req.body;

    // Validate that products array exists and is not empty
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one product' });
    }

    // If using reservations, first confirm them (convert holds to actual stock reduction)
    if (useReservation) {
      for (const item of products) {
        try {
          await confirmReservation(item.product, req.user.id, item.quantity);
        } catch (err) {
          return res.status(400).json({ message: `Failed to confirm reservation: ${err.message}` });
        }
      }
      // If reservations were confirmed, skip stock validation (already done)
      // and go straight to order creation
      const order = new Order({ user: req.user.id, products, total, useReservation: true });
      await order.save();
      await order.populate('products.product');
      return res.status(201).json(order);
    }

    // Try to run validation + decrement + order creation inside a transaction.
    // If transactions aren't supported (e.g., standalone mongod), fall back to non-transactional path.
    let order;
    try {
      await session.withTransaction(async () => {
        // Step 1: Validate stock availability for all products (within txn)
        for (const item of products) {
          const product = await Product.findById(item.product).session(session);
          if (!product) {
            throw { status: 404, message: `Product ${item.product} not found` };
          }
          if (product.stock < item.quantity) {
            throw { status: 400, message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` };
          }
        }

        // Step 2: Reduce stock for each product (within txn)
        for (const item of products) {
          const product = await Product.findById(item.product).session(session);
          const previousStock = product.stock;
          const updatedProduct = await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: -item.quantity } },
            { new: true, session }
          );
          
          // Log the inventory change within the transaction
          await logInventoryChange({
            productId: item.product,
            quantity: -item.quantity,
            reason: 'order_created',
            orderId: null, // will be set after order is created below
            userId: req.user.id,
            previousStock,
            newStock: updatedProduct.stock,
            session
          });
        }

        // Step 3: Create the order (within txn)
        order = new Order({ user: req.user.id, products, total });
        await order.save({ session });
      });
    } catch (txErr) {
      // If txErr is a thrown status object, rethrow to be handled below
      if (txErr && txErr.status) {
        throw txErr;
      }

      // If transactions are not supported or another error occurred, fall back.
      // We'll perform non-transactional validation + updates as before.
      // (This keeps behavior compatible with standalone mongod during development.)
      for (const item of products) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(404).json({ message: `Product ${item.product} not found` });
        }
        if (product.stock < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` });
        }
      }

      for (const item of products) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } },
          { new: true }
        );
      }

      order = new Order({ user: req.user.id, products, total });
      await order.save();

      // Log inventory changes (non-transactional fallback path)
      for (const item of products) {
        const product = await Product.findById(item.product);
        await logInventoryChange({
          productId: item.product,
          quantity: -item.quantity,
          reason: 'order_created',
          orderId: order._id,
          userId: req.user.id,
          previousStock: product.stock + item.quantity, // reconstruct previous stock
          newStock: product.stock,
          notes: 'Non-transactional fallback'
        });
      }
    }

    // Populate products before sending response
    await order.populate('products.product');

    // Emit real-time event to admins
    emitToAdmins('order:created', {
      _id: order._id,
      user: { username: req.user.username },
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
      products: order.products,
    });

    // Check for low stock alerts after order is created
    (async () => {
      try {
        for (const item of products) {
          const product = await Product.findById(item.product);
          if (product && product.reorderLevel && product.stock <= product.reorderLevel) {
            await createLowStockAlert({
              productId: item.product,
              stock: product.stock,
              available: product.stock,
              reorderLevel: product.reorderLevel,
              triggeredBy: 'order_created'
            });
            // Emit low-stock alert event
            emitToAdmins('lowstock:alert', {
              productId: item.product,
              productName: product.name,
              stock: product.stock,
              reorderLevel: product.reorderLevel,
            });
          }
        }
      } catch (alertErr) {
        // Log but don't fail the order if alert creation fails
        console.error('Failed to create low-stock alert:', alertErr.message);
      }
    })();

    res.status(201).json(order);
  } catch (err) {
    // If error was thrown with status/message
    if (err && err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    res.status(400).json({ message: err.message || 'Could not create order' });
  } finally {
    session.endSession();
  }
});

// Update order status (admin/manager)
router.put('/:id', auth(['admin', 'manager']), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const previousStatus = order.status;
    const newStatus = req.body.status;

    // If cancelling the order, restore stock
    if (newStatus === 'cancelled' && previousStatus !== 'cancelled') {
      for (const item of order.products) {
        const product = await Product.findById(item.product);
        const previousStockVal = product.stock;
        const updatedProduct = await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } },
          { new: true }
        );

        // Log the inventory restoration
        await logInventoryChange({
          productId: item.product,
          quantity: item.quantity,
          reason: 'order_cancelled',
          orderId: order._id,
          userId: req.user.id,
          previousStock: previousStockVal,
          newStock: updatedProduct.stock
        });
      }
    }

    // If un-cancelling (unlikely but safe), reduce stock again
    if (previousStatus === 'cancelled' && newStatus !== 'cancelled') {
      for (const item of order.products) {
        const product = await Product.findById(item.product);
        const previousStockVal = product.stock;
        const updatedProduct = await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } },
          { new: true }
        );

        // Log the inventory reduction when un-cancelling
        await logInventoryChange({
          productId: item.product,
          quantity: -item.quantity,
          reason: 'order_created', // treat as re-creating the order
          orderId: order._id,
          userId: req.user.id,
          previousStock: previousStockVal,
          newStock: updatedProduct.stock,
          notes: 'Order un-cancelled'
        });
      }
    }

    // Update the order status
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status: newStatus },
      { new: true }
    ).populate('products.product');

    // Emit real-time event to admins
    emitToAdmins('order:updated', {
      _id: updatedOrder._id,
      status: updatedOrder.status,
      previousStatus,
      total: updatedOrder.total,
      updatedAt: new Date(),
    });

    res.json(updatedOrder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete order - only if pending, and restore stock
router.delete('/:id', auth(['admin', 'manager']), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Only allow deletion of pending orders
    if (order.status !== 'pending') {
      return res.status(400).json({ message: `Cannot delete order with status '${order.status}'. Only pending orders can be deleted.` });
    }

    // Restore stock for all products
    for (const item of order.products) {
      const product = await Product.findById(item.product);
      const previousStockVal = product.stock;
      const updatedProduct = await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } },
        { new: true }
      );

      // Log the inventory restoration
      await logInventoryChange({
        productId: item.product,
        quantity: item.quantity,
        reason: 'order_deleted',
        orderId: order._id,
        userId: req.user.id,
        previousStock: previousStockVal,
        newStock: updatedProduct.stock
      });
    }

    // Delete the order
    await Order.findByIdAndDelete(req.params.id);

    res.json({ message: 'Order deleted and stock restored' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
