const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

(async ()=>{
  try{
    const testEmail = `inventory.test+${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    console.log('Registering', testEmail);
    const reg = await axios.post(`${API_BASE}/auth/register`, {
      username: 'inventory-tester',
      email: testEmail,
      password: testPassword,
      role: 'admin'
    });
    console.log('Register response', reg.status, reg.data);

    const login = await axios.post(`${API_BASE}/auth/login`, { email: testEmail, password: testPassword });
    console.log('Login response', login.status, login.data);
  } catch(err){
    console.error('ERROR', err.response?.status, err.response?.data, err.message);
  }
})();