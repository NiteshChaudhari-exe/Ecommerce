const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const axios = require('axios');
const app = require('../src/app');

jest.setTimeout(60000);

describe('Concurrency integration test (stock validation)', () => {
  let mongod;
  let server;
  let port;
  let api;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    server = app.listen(0);
    port = server.address().port;
    api = axios.create({ baseURL: `http://localhost:${port}/api`, timeout: 20000 });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
    await new Promise((r) => server.close(r));
  });

  test('no oversell with stock validation (non-transactional mode)', async () => {
    // Register manager
    const managerEmail = `mgr+${Date.now()}@example.com`;
    const managerPass = 'Password123!';
    await api.post('/auth/register', { username: 'mgr', email: managerEmail, password: managerPass, role: 'manager' }).catch(() => {});
    const mgrLogin = await api.post('/auth/login', { email: managerEmail, password: managerPass });
    const mgrToken = mgrLogin.data.token;

    // Register employee
    const empEmail = `emp+${Date.now()}@example.com`;
    await api.post('/auth/register', { username: 'emp', email: empEmail, password: managerPass, role: 'employee' }).catch(() => {});
    const empLogin = await api.post('/auth/login', { email: empEmail, password: managerPass });
    const empToken = empLogin.data.token;

    const adminHeaders = { Authorization: `Bearer ${mgrToken}` };
    const orderHeaders = { Authorization: `Bearer ${empToken}` };

    // Create product stock=100
    const prodRes = await api.post('/products', { name: 'Concurrency SKU', price: 10, stock: 100, category: 'Test', reorderLevel: 5 }, { headers: adminHeaders });
    const productId = prodRes.data._id;

    // Fire concurrent orders
    const runConcurrent = async (count) => {
      const promises = Array.from({ length: count }, () =>
        api.post('/orders', { products: [{ product: productId, quantity: 1 }], total: 10 }, { headers: orderHeaders })
          .then(() => ({ success: true }))
          .catch(e => ({ success: false, err: e.response?.data?.message || e.message }))
      );
      return Promise.all(promises);
    };

    // Fire 50 orders concurrently
    const res1 = await runConcurrent(50);
    const success1 = res1.filter(r => r.success).length;
    expect(success1).toBe(50);

    // Fire 60 orders concurrently (only 50 stock left)
    const res2 = await runConcurrent(60);
    const success2 = res2.filter(r => r.success).length;
    const fail2 = res2.filter(r => !r.success).length;
    
    // Stock validation prevents overselling (all 50 remaining should succeed)
    expect(success2).toBe(50);
    expect(fail2).toBe(10);

    // Final product stock should be exactly 0
    const products = (await api.get('/products')).data;
    const final = products.find(p => p._id === productId);
    expect(final).toBeDefined();
    expect(final.stock).toBe(0);

    // Inventory logs should be created (100 successful order entries)
    const logsRes = await api.get(`/inventory-logs?productId=${productId}&limit=500`, { headers: adminHeaders });
    const logs = logsRes.data.logs || [];
    expect(logs.length).toBeGreaterThanOrEqual(100);
  });
});
