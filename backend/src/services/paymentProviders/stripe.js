// Stripe provider - deprecated (Nepal-only version uses eSewa and Khalti)

async function create() {
  throw new Error('Stripe is not available. Please use eSewa or Khalti.');
}

async function verify() {
  throw new Error('Stripe is not available. Please use eSewa or Khalti.');
}

async function webhookHandler(req, res) {
  res.status(410).json({ message: 'Stripe provider is deprecated. Use eSewa or Khalti instead.' });
}

module.exports = { create, verify, webhookHandler };
