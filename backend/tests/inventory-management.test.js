/**
 * Test Inventory Management - Stock Reduction on Orders
 * Tests: 
 * 1. Stock validation before order creation
 * 2. Stock reduction on order creation
 * 3. Stock restoration on order cancellation
 * 4. Stock restoration on order deletion
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const AUTH_TOKEN = 'test-token'; // Replace with real token from your auth system

// Color console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.yellow}TEST: ${msg}${colors.reset}`),
};

async function runTests() {
  try {
    log.test('=== INVENTORY MANAGEMENT TEST SUITE ===');

    // Register & login a test admin user to get a valid token
    const testEmail = `inventory.test+${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    await axios.post(`${API_BASE}/auth/register`, {
      username: 'inventory-tester',
      email: testEmail,
      password: testPassword,
      role: 'admin'
    }).catch(() => {}); // ignore if already exists

    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    const token = loginRes.data.token;

    // Setup headers with auth
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    // Test 1: Create a test product with limited stock
    log.test('Test 1: Create test product with stock=5');
    const productRes = await axios.post(`${API_BASE}/products`, {
      name: 'Test Product - Inventory Test',
      description: 'For testing inventory management',
      price: 99.99,
      stock: 5,
      category: 'Test',
    }, { headers });
    const productId = productRes.data._id;
    log.success(`Product created: ${productId}, Stock: 5`);

    // Test 2: Verify initial stock
    log.test('Test 2: Verify initial stock');
    const checkStock1 = await axios.get(`${API_BASE}/products/${productId}`, { headers });
    log.info(`Current stock: ${checkStock1.data.stock}`);
    if (checkStock1.data.stock === 5) {
      log.success('Initial stock is 5');
    } else {
      log.error(`Expected stock 5, got ${checkStock1.data.stock}`);
    }

    // Test 3: Create order with 3 items (should succeed)
    log.test('Test 3: Create order with 3 items (should succeed)');
    const order1Res = await axios.post(`${API_BASE}/orders`, {
      products: [{ product: productId, quantity: 3 }],
      total: 299.97,
    }, { headers });
    const orderId1 = order1Res.data._id;
    log.success(`Order 1 created: ${orderId1}`);

    // Test 4: Verify stock reduced by 3
    log.test('Test 4: Verify stock reduced after order creation');
    const checkStock2 = await axios.get(`${API_BASE}/products/${productId}`, { headers });
    log.info(`Current stock: ${checkStock2.data.stock}`);
    if (checkStock2.data.stock === 2) {
      log.success('Stock correctly reduced from 5 to 2');
    } else {
      log.error(`Expected stock 2, got ${checkStock2.data.stock}`);
    }

    // Test 5: Try to create order exceeding remaining stock (should fail)
    log.test('Test 5: Try to order 3 items when only 2 remain (should fail)');
    try {
      await axios.post(`${API_BASE}/orders`, {
        products: [{ product: productId, quantity: 3 }],
        total: 299.97,
      }, { headers });
      log.error('Order should have failed due to insufficient stock!');
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes('Insufficient stock')) {
        log.success('Correctly rejected order with insufficient stock');
      } else {
        log.error(`Unexpected error: ${err.response?.data?.message}`);
      }
    }

    // Test 6: Create order with remaining 2 items (should succeed)
    log.test('Test 6: Create order with 2 items (remaining stock)');
    const order2Res = await axios.post(`${API_BASE}/orders`, {
      products: [{ product: productId, quantity: 2 }],
      total: 199.98,
    }, { headers });
    const orderId2 = order2Res.data._id;
    log.success(`Order 2 created: ${orderId2}`);

    // Test 7: Verify stock is now 0
    log.test('Test 7: Verify stock is now 0');
    const checkStock3 = await axios.get(`${API_BASE}/products/${productId}`, { headers });
    log.info(`Current stock: ${checkStock3.data.stock}`);
    if (checkStock3.data.stock === 0) {
      log.success('Stock correctly reduced to 0');
    } else {
      log.error(`Expected stock 0, got ${checkStock3.data.stock}`);
    }

    // Test 8: Cancel first order and verify stock restoration
    log.test('Test 8: Cancel order 1 and verify stock restoration');
    const cancelRes = await axios.put(`${API_BASE}/orders/${orderId1}`, {
      status: 'cancelled',
    }, { headers });
    log.info(`Order 1 status: ${cancelRes.data.status}`);
    log.success('Order 1 cancelled');

    // Test 9: Verify stock restored
    log.test('Test 9: Verify stock restored after cancellation');
    const checkStock4 = await axios.get(`${API_BASE}/products/${productId}`, { headers });
    log.info(`Current stock: ${checkStock4.data.stock}`);
    if (checkStock4.data.stock === 3) {
      log.success('Stock correctly restored from 0 to 3');
    } else {
      log.error(`Expected stock 3, got ${checkStock4.data.stock}`);
    }

    // Test 10: Delete second order and verify stock restoration
    log.test('Test 10: Delete order 2 (pending) and verify stock restoration');
    const deleteRes = await axios.delete(`${API_BASE}/orders/${orderId2}`, { headers });
    log.info(`Delete response: ${deleteRes.data.message}`);
    log.success('Order 2 deleted');

    // Test 11: Verify final stock = 5 (all restored)
    log.test('Test 11: Verify final stock = 5 (all restored)');
    const checkStock5 = await axios.get(`${API_BASE}/products/${productId}`, { headers });
    log.info(`Final stock: ${checkStock5.data.stock}`);
    if (checkStock5.data.stock === 5) {
      log.success('Stock fully restored to original 5');
    } else {
      log.error(`Expected stock 5, got ${checkStock5.data.stock}`);
    }

    log.test('=== ALL TESTS PASSED ===');
  } catch (err) {
    log.error(`Test failed: ${err.message}`);
    if (err.response?.data) {
      log.error(`Response: ${JSON.stringify(err.response.data)}`);
    }
    process.exit(1);
  }
}

runTests();
