const express = require('express');
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const { getProvider } = require('../services/paymentProviders');

const router = express.Router();

// Create a payment initiation for an order using the selected provider
router.post('/create-intent', auth(), async (req, res) => {
  try {
    const { orderId, amount, provider } = req.body;
    if (!orderId || typeof amount !== 'number') {
      return res.status(400).json({ message: 'orderId and numeric amount are required' });
    }

    const svc = getProvider(provider);
    const result = await svc.create({ orderId, amount });
    res.json({ provider: provider || process.env.PAYMENT_PROVIDER_DEFAULT || 'stripe', result });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to create payment intent' });
  }
});

// Confirm payment (simple retrieval/acknowledgement)
router.post('/confirm', auth(), async (req, res) => {
  try {
    const { provider, paymentIntentId, orderId, token, amount, refId } = req.body;
    const svc = getProvider(provider);

    // Different providers use different verification parameters. Adapter's verify
    // should normalize response.
    const verifyResp = await svc.verify({ paymentIntentId, token, amount, refId, orderId });

    // If adapter updated order, fetch it; else update here for common case
    let order = null;
    if (orderId) {
      try {
        order = await Order.findById(orderId);
      } catch (err) {
        console.error('Failed to fetch order after verify:', err.message);
      }
    }

    res.json({ message: 'Payment verification result', verify: verifyResp, order });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Payment confirmation failed' });
  }
});
// NOTE: Webhook handling for Stripe requires raw body parsing. We extract
// the webhook handler below so app.js can register it before express.json()
// to preserve the raw request body for signature verification.

// Stripe webhook handler (raw body required)
// This handler is exported as `webhookHandler` so app.js can mount it
// using express.raw({ type: 'application/json' }) before express.json().
// Generic webhook handler: delegates to provider-specific webhookHandler
const genericWebhookHandler = async (req, res) => {
  // provider can be supplied via query param or header
  const provider = (req.query.provider || req.headers['x-payment-provider'] || process.env.PAYMENT_PROVIDER_DEFAULT || 'stripe').toLowerCase();
  try {
    const svc = getProvider(provider);
    if (svc && typeof svc.webhookHandler === 'function') {
      return svc.webhookHandler(req, res);
    }
    res.status(404).send('Webhook handler not implemented for provider: ' + provider);
  } catch (err) {
    console.error('Webhook dispatch error:', err.message);
    res.status(500).send('Webhook dispatch error');
  }
};

// attach handler so other modules (app.js) can mount it before body parsers
module.exports = router;
module.exports.webhookHandler = genericWebhookHandler;

// eSewa callback route (redirect target)
// eSewa will redirect the user to the `su` (success) URL configured in the
// payment request with query parameters identifying the transaction. We expose
// a server-side callback that verifies the payment and then redirects to the
// frontend confirmation page.
router.get('/esewa/callback', async (req, res) => {
  try {
    // Typical eSewa params: amt, pid, scd, refId (varies). We'll forward what we have.
    const { pid, refId, amt } = req.query;
    const svc = getProvider('esewa');
    const verifyResp = await svc.verify({ refId, orderId: pid, pid, amount: amt });

    // Redirect to frontend order confirmation (frontend base configured via env)
    const frontendBase = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
    if (verifyResp && verifyResp.status === 'completed') {
      return res.redirect(`${frontendBase}/orders`);
    }
    return res.redirect(`${frontendBase}/payment-failed`);
  } catch (err) {
    console.error('eSewa callback error:', err.message);
    const frontendBase = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
    return res.redirect(`${frontendBase}/payment-failed`);
  }
});
