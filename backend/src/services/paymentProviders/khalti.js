const Order = require('../../models/Order');

// Khalti adapter
// This adapter provides the minimal surface needed by the app:
// - create({orderId, amount}) -> returns data for client to start checkout (public key)
// - verify({token, amount}) -> calls Khalti verify endpoint in production
// - webhookHandler(req,res) -> optional (Khalti supports server-side verify primarily)

const KHALTI_PUBLIC_KEY = process.env.KHALTI_PUBLIC_KEY || '';
const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY || '';

async function create({ orderId, amount } = {}) {
  // For Khalti, the client typically invokes the Khalti Checkout widget with the public key
  // Server does not need to create a PaymentIntent; return publicKey and order metadata
  return { publicKey: KHALTI_PUBLIC_KEY, orderId, amount };
}

async function verify({ token, amount, orderId } = {}) {
  if (!KHALTI_SECRET_KEY) throw new Error('KHALTI_SECRET_KEY not configured');
  if (!token) throw new Error('token required for Khalti verification');

  // Use server-side verify API
  // Khalti verify endpoint: https://khalti.com/api/v2/payment/verify/
  // Node 18+ has global fetch; use it if available
  const verifyUrl = 'https://khalti.com/api/v2/payment/verify/';
  const body = { token, amount };

  const resp = await fetch(verifyUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${KHALTI_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Khalti verify failed: ${txt}`);
  }

  const data = await resp.json();

  // Optionally update order here
  if (orderId) {
    try {
      await Order.findByIdAndUpdate(orderId, {
        status: 'processing',
        paymentStatus: 'completed',
        transactionId: data.idx || data.payment_id || null,
        paidAt: new Date()
      });
    } catch (err) {
      console.error('Khalti verify: failed to update order', err.message);
    }
  }

  return { status: 'completed', raw: data };
}

async function webhookHandler(req, res) {
  // Khalti generally uses client-side verification + server-side verify, webhooks are optional.
  res.status(501).json({ message: 'Khalti webhook not implemented - use server-side verify' });
}

module.exports = { create, verify, webhookHandler };
