const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Product = require('../src/models/Product');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

afterEach(async () => {
  // Clear DB between tests
  await User.deleteMany({});
  await Product.deleteMany({});
});

describe('Wishlist integration (login merge + endpoints)', () => {
  test('login merges guest wishlist into user wishlist and wishlist endpoints work', async () => {
    // register user
    const registerRes = await request(app).post('/api/auth/register').send({ username: 'testuser', email: 'test@example.com', password: 'pass1234' });
    expect(registerRes.status).toBe(201);

    // create products
    const p1 = await Product.create({ name: 'P1', price: 10, stock: 5 });
    const p2 = await Product.create({ name: 'P2', price: 20, stock: 3 });

    const guestWishlist = [p1._id.toString(), p2._id.toString()];

    // login with wishlist payload
    const loginRes = await request(app).post('/api/auth/login').send({ email: 'test@example.com', password: 'pass1234', wishlist: guestWishlist });
    if (loginRes.status !== 200) {
      // eslint-disable-next-line no-console
      console.error('LOGIN ERROR BODY:', loginRes.body);
    }
    expect(loginRes.status).toBe(200);
    // debug: log login response body if wishlist empty
    // eslint-disable-next-line no-console
    // console.log('LOGIN RES BODY', loginRes.body);
    expect(loginRes.body.wishlist).toBeDefined();
    expect(Array.isArray(loginRes.body.wishlist)).toBe(true);
    // If merge didn't occur in the auth route, ensure DB user has wishlist
    if ((loginRes.body.wishlist || []).length === 0) {
      const dbUser = await User.findOne({ email: 'test@example.com' }).populate('wishlist');
      // eslint-disable-next-line no-console
      console.log('DB user wishlist length (debug):', (dbUser.wishlist || []).length);
    }
    expect(loginRes.body.wishlist.length).toBe(2);

    const token = loginRes.body.token;
    expect(token).toBeTruthy();

    // GET wishlist
    const getRes = await request(app).get('/api/users/wishlist').set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.wishlist.length).toBe(2);

    // DELETE one item
    const delRes = await request(app).delete(`/api/users/wishlist/${p1._id.toString()}`).set('Authorization', `Bearer ${token}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body.wishlist.length).toBe(1);

    // POST add same item again (merge)
    const postRes = await request(app).post('/api/users/wishlist').set('Authorization', `Bearer ${token}`).send({ items: [p1._id.toString()] });
    expect(postRes.status).toBe(200);
    expect(postRes.body.wishlist.length).toBe(2);
  });
});
