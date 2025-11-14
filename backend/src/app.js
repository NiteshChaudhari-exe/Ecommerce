require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// IMPORTANT: require payment routes early so we can mount the Stripe webhook
// route with express.raw BEFORE express.json() to preserve the raw body for
// signature verification.
const paymentRoutes = require('./routes/payment');

// Mount raw webhook endpoint before express.json()
// Stripe expects the raw request body to validate signatures. In production
// set STRIPE_WEBHOOK_SECRET in .env and register the endpoint in Stripe dashboard.
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), (req, res) => {
	// forward to handler exported from the payment router
	if (paymentRoutes && paymentRoutes.webhookHandler) {
		return paymentRoutes.webhookHandler(req, res);
	}
	res.status(404).send('Webhook handler not available');
});

app.use(express.json());

// Serve uploaded files from backend/uploads at /uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Uploads route (for admin image uploads)
const uploadsRoutes = require('./routes/uploads');
app.use('/api/uploads', uploadsRoutes);

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const dashboardRoutes = require('./routes/dashboard');
const reportingRoutes = require('./routes/reporting');
const notificationsRoutes = require('./routes/notifications');
const wishlistRoutes = require('./routes/wishlist');
const inventoryLogsRoutes = require('./routes/inventoryLogs');
const reservationsRoutes = require('./routes/reservations');
const lowStockAlertsRoutes = require('./routes/lowStockAlerts');
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reporting', reportingRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/users/wishlist', wishlistRoutes);
app.use('/api/inventory-logs', inventoryLogsRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/low-stock-alerts', lowStockAlertsRoutes);
app.use('/api/payment', paymentRoutes);

module.exports = app;
