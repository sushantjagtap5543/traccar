const axios = require('axios');

async function testLoginFlow() {
  const baseUrl = 'http://localhost:3000'; // Adjust if your backend port is different
  const testMobile = '919876543210';
  const testPassword = 'Password123';

  console.log('--- Testing Mobile Login Flow ---');

  try {
    // 1. Attempt login with mobile
    console.log(`Testing POST /auth/login-mobile with mobile: ${testMobile}`);
    const res = await axios.post(`${baseUrl}/auth/login-mobile`, {
      whatsapp_number: testMobile,
      password: testPassword
    });

    console.log('✅ Login Successful!');
    console.log('Access Token:', res.data.accessToken);
    console.log('User:', res.data.user);

  } catch (err) {
    if (err.response) {
      console.error('❌ Login Failed:', err.response.data.message || err.response.statusText);
      console.log('Status code:', err.response.status);
    } else {
      console.error('❌ Error connecting to server:', err.message);
      console.log('Make sure the backend is running at', baseUrl);
    }
  }
}

testLoginFlow();
