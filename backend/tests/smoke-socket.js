#!/usr/bin/env node

/**
 * SMOKE TEST: Real-time Admin Dashboard with Socket.io
 * 
 * This script tests the Socket.io integration by:
 * 1. Connecting to the backend as an admin user
 * 2. Listening for real-time events
 * 3. Creating a test order via API
 * 4. Verifying that the order:created event is received
 * 
 * Usage: node tests/smoke-socket.js <admin_token>
 */

const io = require('socket.io-client');

// Parse command-line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node tests/smoke-socket.js <admin_token>');
  console.error('Example: node tests/smoke-socket.js eyJhbGc...');
  process.exit(1);
}

const ADMIN_TOKEN = args[0];
const API_URL = 'http://localhost:5000';
const SOCKET_URL = API_URL;

console.log('\n🚀 Starting Socket.io Smoke Test');
console.log('━'.repeat(60));

// Step 1: Connect to Socket.io with admin token
console.log('\n[Step 1] Connecting to Socket.io with admin token...');

const socket = io(SOCKET_URL, {
  auth: { token: ADMIN_TOKEN },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

let connectionSuccess = false;
let eventReceived = false;

socket.on('connect', () => {
  console.log('✅ Socket connected! Socket ID:', socket.id);
  connectionSuccess = true;
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

socket.on('disconnect', () => {
  console.log('ℹ️  Socket disconnected');
});

// Step 2: Listen for order:created event
console.log('\n[Step 2] Registering event listeners...');
socket.on('order:created', (eventData) => {
  console.log('✅ Event "order:created" received!');
  console.log('   Order ID:', eventData.data._id);
  console.log('   Total:', eventData.data.total);
  console.log('   Status:', eventData.data.status);
  console.log('   Timestamp:', new Date(eventData.timestamp).toISOString());
  eventReceived = true;
});

socket.on('order:updated', (eventData) => {
  console.log('✅ Event "order:updated" received!');
  console.log('   Order ID:', eventData.data._id);
  console.log('   New Status:', eventData.data.status);
});

socket.on('lowstock:alert', (eventData) => {
  console.log('✅ Event "lowstock:alert" received!');
  console.log('   Product:', eventData.data.productName);
  console.log('   Stock:', eventData.data.stock);
});

console.log('✅ Event listeners registered for: order:created, order:updated, lowstock:alert');

// Step 3: Wait for connection, then create a test order
setTimeout(async () => {
  if (!connectionSuccess) {
    console.error('❌ Connection failed. Exiting.');
    process.exit(1);
  }

  console.log('\n[Step 3] Creating a test order to trigger real-time event...');

  try {
    // Create a test order with sample products
    const orderPayload = {
      products: [
        {
          product: '1', // Use a valid product ID from your DB
          quantity: 2,
        },
      ],
      total: 100.00,
    };

    const response = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify(orderPayload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Failed to create order:', error.message);
      console.log('\n💡 Tip: Ensure you have valid product IDs in your database.');
      console.log('   Run: node backend/scripts/seed.js');
    } else {
      const order = await response.json();
      console.log('✅ Test order created successfully');
      console.log('   Order ID:', order._id);
      console.log('   Total:', order.total);
    }
  } catch (err) {
    console.error('❌ Error creating test order:', err.message);
  }

  // Step 4: Wait for event and verify
  console.log('\n[Step 4] Waiting for real-time event (5 seconds timeout)...');

  setTimeout(() => {
    console.log('\n' + '━'.repeat(60));
    if (eventReceived) {
      console.log('✅ TEST PASSED: Real-time event received successfully!');
      console.log('\n📊 Socket.io integration is working correctly.');
      console.log('   - Admin can connect with JWT');
      console.log('   - Events are emitted on order creation');
      console.log('   - Events are delivered in real-time\n');
    } else {
      console.log('⚠️  TEST INCONCLUSIVE: No real-time event received.');
      console.log('\n🔍 Possible causes:');
      console.log('   1. Socket.io server not emitting events');
      console.log('   2. Order creation failed silently');
      console.log('   3. Admin is not in the admin-room\n');
    }
    process.exit(eventReceived ? 0 : 1);
  }, 5000);
}, 2000);

// Graceful shutdown on timeout
setTimeout(() => {
  console.error('\n❌ Test timeout (30 seconds). Exiting.');
  process.exit(1);
}, 30000);
