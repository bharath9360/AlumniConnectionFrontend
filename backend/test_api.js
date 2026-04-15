require('dotenv').config();
const URL = 'http://localhost:5000/api';

// Credentials read from .env (LOAD_TEST_EMAIL / LOAD_TEST_PASSWORD)
const TEST_EMAIL    = process.env.LOAD_TEST_EMAIL;
const TEST_PASSWORD = process.env.LOAD_TEST_PASSWORD;

async function runTests() {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    console.error('❌ LOAD_TEST_EMAIL and LOAD_TEST_PASSWORD must be set in .env');
    process.exit(1);
  }
  console.log('🧪 Starting API Integration Tests...\n');
  try {
    console.log('1. Testing [POST] /auth/login (Alumni)...');
    let res = await fetch(`${URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, role: 'alumni' })
    });
    let data = await res.json();
    if (!res.ok) throw new Error(data.message);
    const apiToken = data.token;
    console.log('✅ Alumni Login successful. Token received.\n');

    console.log('2. Testing [GET] /posts...');
    res = await fetch(`${URL}/posts`, { headers: { 'Authorization': `Bearer ${apiToken}` }});
    data = await res.json();
    if (!res.ok) throw new Error(data.message);
    console.log(`✅ Posts fetched successfully. Count: ${data.data.length}\n`);

    console.log('3. Testing [POST] /posts...');
    res = await fetch(`${URL}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiToken}` },
      body: JSON.stringify({ content: 'Hello from API Integration Test!' })
    });
    data = await res.json();
    if (!res.ok) throw new Error(data.message);
    console.log('✅ Post created successfully.\n');

    console.log('4. Testing [GET] /jobs...');
    res = await fetch(`${URL}/jobs`, { headers: { 'Authorization': `Bearer ${apiToken}` }});
    data = await res.json();
    if (!res.ok) throw new Error(data.message);
    console.log(`✅ Jobs fetched successfully. Count: ${data.data.length}\n`);

    console.log('5. Testing [POST] /auth/login (Invalid Password)...');
    res = await fetch(`${URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bharath@mamcet.com', password: 'wrongpassword', role: 'alumni' })
    });
    data = await res.json();
    if (res.status === 401 && data.message === 'Incorrect password') {
      console.log('✅ Correctly rejected invalid login with 401 Incorrect password.\n');
    } else {
      throw new Error(`Expected 401 'Incorrect password' but got ${res.status} '${data.message}'`);
    }

    console.log('🎉 ALL API TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('\n❌ API Test Failed:', err.message);
  }
}
runTests();
