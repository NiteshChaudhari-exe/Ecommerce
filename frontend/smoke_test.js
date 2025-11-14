const API = process.env.API_URL || 'http://localhost:5000/api';
const fetch = global.fetch || require('node-fetch');

(async () => {
  try {
    console.log('Starting smoke test against', API);

    const creds = { username: 'smoke_test_user', email: 'smoke+build@example.com', password: 'Password123!' };

    // Try login
    let res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: creds.email, password: creds.password }),
    });

    if (res.status === 200) {
      console.log('Login succeeded (existing user).');
    } else {
      console.log('Login failed, attempting register...');
      res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Backend User.role enum only allows ['admin','manager','employee']
        // Use 'employee' here so registration passes schema validation
        body: JSON.stringify({ username: creds.username, email: creds.email, password: creds.password, role: 'employee' }),
      });
      const regBody = await res.text();
      console.log('Register response:', res.status, regBody);
      if (res.status !== 201 && res.status !== 200) {
        console.log('Register did not return 200/201; continuing to attempt login');
      }

      // Try login again
      res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: creds.email, password: creds.password }),
      });
    }

    const body = await res.json().catch(() => null);
    if (!body || !body.token) {
      console.error('Login did not return token. Response:', body);
      process.exitCode = 2;
      return;
    }

    const token = body.token;
    console.log('Received token. Proceeding to fetch products...');

    // Fetch products
    res = await fetch(`${API}/products`);
    const products = await res.json().catch(() => []);
    console.log('Products count:', (products && products.length) || 0);
    if (!products || products.length === 0) {
      console.warn('No products returned. Smoke test will stop here.');
      return;
    }

    const first = products[0];
    console.log('Using product:', first._id || first.id || '(no id)');

    // Create an order
    const orderData = {
      products: [
        { product: first._id || first.id || first._id, quantity: 1 },
      ],
      total: first.price || 0,
      status: 'pending',
    };

    res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(orderData),
    });

    const orderResp = await res.json().catch(() => null);
    console.log('Order create status:', res.status, orderResp);

    // Fetch user orders
    res = await fetch(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } });
    const orders = await res.json().catch(() => []);
    console.log('User orders count:', (orders && orders.length) || 0);
    if (orders && orders.length > 0) console.log('Latest order id:', orders[0]._id || orders[0].id);

    console.log('Smoke test finished.');
  } catch (err) {
    console.error('Smoke test error:', err);
    process.exitCode = 3;
  }
})();
