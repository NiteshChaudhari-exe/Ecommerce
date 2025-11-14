const API = process.env.API_URL || 'http://localhost:5000/api';
const fetch = global.fetch || require('node-fetch');

(async () => {
  try {
    console.log('Starting wishlist smoke test against', API);

    const creds = { username: 'wishlist_test_user', email: 'wishlist+test@example.com', password: 'Password123!' };

    // Ensure user exists
    let res = await fetch(`${API}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: creds.username, email: creds.email, password: creds.password, role: 'employee' })
    }).catch(() => null);

    // Create two products (if backend allows POST /products in current environment). If not, fetch products and pick two.
    res = await fetch(`${API}/products`);
    const products = await res.json().catch(() => []);
    if (!products || products.length === 0) {
      console.error('No products available to test wishlist. Ensure backend has seed data.');
      process.exitCode = 2;
      return;
    }

    const p1 = products[0];
    const p2 = products[1] || products[0];
    const guestWishlist = [p1._id || p1.id, p2._id || p2.id].filter(Boolean);

    // Login with wishlist payload
    res = await fetch(`${API}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: creds.email, password: creds.password, wishlist: guestWishlist })
    });
    const loginBody = await res.json().catch(() => null);
    if (res.status !== 200) {
      console.error('Login failed for wishlist smoke test', res.status, loginBody);
      process.exitCode = 3;
      return;
    }
    const token = loginBody.token;
    console.log('Login success, merged wishlist length:', (loginBody.wishlist || []).length);

    // GET server wishlist
    res = await fetch(`${API}/users/wishlist`, { headers: { Authorization: `Bearer ${token}` } });
    const wishlistResp = await res.json().catch(() => null);
    console.log('Server wishlist count after merge:', (wishlistResp.wishlist || []).length);

    console.log('Wishlist smoke test finished.');
  } catch (err) {
    console.error('Wishlist smoke test error:', err);
    process.exitCode = 4;
  }
})();
