const stripe = require('./stripe');
const khalti = require('./khalti');
const esewa = require('./esewa');

const providers = {
	stripe,
	khalti,
	esewa
};

function getProvider(name) {
	const key = (name || process.env.PAYMENT_PROVIDER_DEFAULT || 'stripe').toLowerCase();
	if (!providers[key]) throw new Error(`Payment provider '${key}' is not registered`);
	return providers[key];
}

module.exports = { getProvider, providers };
