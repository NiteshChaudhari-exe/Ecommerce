/**
 * Concurrency Test: Stock Reduction Under Load
 *
 * This script will:
 * - Create a manager user (to create a product)
 * - Create an employee user (to place orders)
 * - Create a product with stock = 100
 * - Fire 50 concurrent orders (qty=1) — expect 50 succeed
 * - Fire 60 concurrent orders (qty=1) — expect 50 succeed, 10 fail
 * - Validate final stock and inventory logs
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.yellow}TEST: ${msg}${colors.reset}`),
  progress: (msg) => console.log(`${colors.blue}→ ${msg}${colors.reset}`),
};

async function registerAndLogin(email, password, role = 'employee') {
  try {
    await axios.post(`${API_BASE}/auth/register`, {
      username: `user-${email.split('@')[0]}`,
      email,
      password,
      role,
    }).catch(() => {}); // Ignore if exists

    const loginRes = await axios.post(`${API_BASE}/auth/login`, { email, password });
    return loginRes.data.token;
  } catch (err) {
    throw new Error(`Auth failed: ${err.message}`);
  }
}
async function concurrencyTest() {
  try {
    // Setup: create manager and employee
    log.progress('Setting up manager user for product creation...');
    const managerEmail = `concurrency-mgr+${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    const managerToken = await registerAndLogin(managerEmail, testPassword, 'manager');
    const adminHeaders = { Authorization: `Bearer ${managerToken}`, 'Content-Type': 'application/json' };
    log.success('Manager user ready');

    log.progress('Setting up employee user for orders...');
    const employeeEmail = `concurrency-emp+${Date.now()}@example.com`;
    const employeeToken = await registerAndLogin(employeeEmail, testPassword, 'employee');
    const orderHeaders = { Authorization: `Bearer ${employeeToken}`, 'Content-Type': 'application/json' };
    log.success('Employee user ready');

    // Create product with stock 100
    log.progress('Creating product with stock=100...');
    const productRes = await axios.post(`${API_BASE}/products`, {
      name: `Concurrency Test Product ${Date.now()}`,
      description: 'For concurrency testing',
      price: 50,
      stock: 100,
      category: 'Test',
      reorderLevel: 10,
    }, { headers: adminHeaders });
    const productId = productRes.data._id;
    log.success(`Product created: ${productId} (stock=100)`);

    // Test 1: 50 concurrent orders
    log.test('\n--- Test 1: 50 concurrent orders (qty=1) ---');
    const promises1 = Array.from({ length: 50 }, () =>
      axios.post(`${API_BASE}/orders`, { products: [{ product: productId, quantity: 1 }], total: 50 }, { headers: orderHeaders })
        .then(() => ({ success: true }))
        .catch(e => ({ success: false, error: e.response?.data?.message }))
    );
    const res1 = await Promise.all(promises1);
    const successCount1 = res1.filter(r => r.success).length;
    const failCount1 = res1.filter(r => !r.success).length;
    log.success(`Test1: ${successCount1} succeeded, ${failCount1} failed`);

    // Test 2: 60 concurrent orders
    log.test('\n--- Test 2: 60 concurrent orders (qty=1) ---');
    const promises2 = Array.from({ length: 60 }, () =>
      axios.post(`${API_BASE}/orders`, { products: [{ product: productId, quantity: 1 }], total: 50 }, { headers: orderHeaders })
        .then(() => ({ success: true }))
        .catch(e => ({ success: false, error: e.response?.data?.message }))
    );
    const res2 = await Promise.all(promises2);
    const successCount2 = res2.filter(r => r.success).length;
    const failCount2 = res2.filter(r => !r.success).length;
    log.success(`Test2: ${successCount2} succeeded, ${failCount2} failed`);

  // Final checks (GET /products used because GET /products/:id isn't implemented)
  const productsList = await axios.get(`${API_BASE}/products`);
  const finalProduct = productsList.data.find(p => p._id === productId) || null;
  const finalStock = finalProduct ? finalProduct.stock : null;
    log.info(`Final stock: ${finalStock}`);

    // Inventory logs via admin
    const logsRes = await axios.get(`${API_BASE}/inventory-logs?productId=${productId}&limit=500`, { headers: adminHeaders });
    const logs = logsRes.data.logs || [];
    log.info(`Inventory logs found: ${logs.length}`);

    // Summary assertions logged
    const totalSuccess = successCount1 + successCount2;
    log.test('\n--- SUMMARY ---');
    log.info(`Total successful orders: ${totalSuccess}`);
    log.info(`Expected final stock: ${100 - totalSuccess}`);
    log.info(`Actual final stock: ${finalStock}`);

    if (finalStock === 100 - totalSuccess) {
      log.success('No oversell detected');
    } else {
      log.error('Potential oversell detected');
    }

    log.success('Concurrency test completed');

  } catch (err) {
    log.error(`Test failed: ${err.message}`);
    if (err.response?.data) log.error(`Response: ${JSON.stringify(err.response.data)}`);
    process.exit(1);
  }
}

concurrencyTest();
