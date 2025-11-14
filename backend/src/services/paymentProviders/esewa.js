const Order = require('../../models/Order');

// eSewa adapter - implements redirect + server-side verify
const ESEWA_MERCHANT_CODE = process.env.ESEWA_MERCHANT_CODE || '';
const ESEWA_PAYMENT_URL = process.env.ESEWA_PAYMENT_URL || 'https://esewa.com.np/epay/main';
const ESEWA_VERIFY_URL = process.env.ESEWA_VERIFY_URL || 'https://esewa.com.np/epay/verify';

async function create({ orderId, amount } = {}) {
  // Return parameters frontend can use to POST to eSewa
  return {
    paymentUrl: ESEWA_PAYMENT_URL,
    params: {
      amt: amount,
      psc: 0,
      pdc: 0,
      tAmt: amount,
      pid: orderId,
      scd: ESEWA_MERCHANT_CODE
    }
  };
}

async function verify({ refId, orderId, amount, pid } = {}) {
  if (!ESEWA_MERCHANT_CODE) throw new Error('ESEWA_MERCHANT_CODE not configured');

  // Build verify request. Many eSewa integrations call a verification endpoint
  // with pid, scd, amt and expect an XML or text response containing Success.
  const verifyUrl = new URL(ESEWA_VERIFY_URL);
  verifyUrl.searchParams.set('pid', pid || orderId || '');
  verifyUrl.searchParams.set('scd', ESEWA_MERCHANT_CODE);
  verifyUrl.searchParams.set('amt', String(amount));

  const resp = await fetch(verifyUrl.toString(), { method: 'GET' });
  const text = await resp.text();

  const success = /success/i.test(text);

  if (success) {
    if (orderId) {
      try {
        await Order.findByIdAndUpdate(orderId, {
          status: 'processing',
          paymentStatus: 'completed',
          transactionId: refId || null,
          paidAt: new Date()
        });
      } catch (err) {
        console.error('eSewa verify: failed to update order', err.message);
      }
    }
    return { status: 'completed', raw: text };
  }

  return { status: 'failed', raw: text };
}

async function webhookHandler(req, res) {
  // eSewa typically uses redirect-based callbacks; webhooks are not common.
  res.status(501).json({ message: 'eSewa webhook not implemented - use server-side verify' });
}

module.exports = { create, verify, webhookHandler };
