const fetch = global.fetch || require('node-fetch');

const API = 'http://localhost:5000/api';

(async () => {
  try {
    console.log('Starting product seed via API...');

    // First, try to login as an admin user (if none exists, register one)
    let adminCreds = { email: 'admin@seed.com', password: 'AdminPass123!' };
    let adminToken = null;

    // Try login first
    let res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminCreds.email, password: adminCreds.password }),
    });

    if (res.status === 200) {
      const body = await res.json();
      adminToken = body.token;
      console.log('✓ Logged in as existing admin');
    } else {
      // Try to register as admin
      console.log('Admin user not found, attempting to register...');
      res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin_seed',
          email: adminCreds.email,
          password: adminCreds.password,
          role: 'admin', // Register as admin
        }),
      });

      if (res.status === 201 || res.status === 200) {
        console.log('✓ Registered new admin user');
        // Now login
        res = await fetch(`${API}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: adminCreds.email, password: adminCreds.password }),
        });
        const body = await res.json();
        adminToken = body.token;
        console.log('✓ Logged in as new admin');
      } else {
        const body = await res.text();
        console.log(`✗ Failed to register admin: ${res.status} ${body}`);
        process.exit(1);
      }
    }

    if (!adminToken) {
      console.error('✗ No admin token obtained');
      process.exit(1);
    }

    const products = [
      {
        name: 'Essential Cotton Tee',
        description: 'Soft 100% cotton tee, regular fit',
        price: 19.99,
        stock: 120,
        category: 'Tops',
        image: 'https://via.placeholder.com/300?text=Cotton+Tee',
      },
      {
        name: 'Classic Straight Jeans',
        description: 'Mid-rise straight leg jeans with comfortable stretch',
        price: 59.99,
        stock: 85,
        category: 'Bottoms',
        image: 'https://via.placeholder.com/300?text=Jeans',
      },
    ];

    // Create each product
    for (const product of products) {
      const res = await fetch(`${API}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(product),
      });

      if (res.status === 201 || res.status === 200) {
        console.log(`✓ Created product: ${product.name}`);
      } else {
        const body = await res.text();
        console.log(`✗ Failed to create ${product.name}: ${res.status} ${body}`);
      }
    }

    console.log('Product seed via API complete.');
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
})();
