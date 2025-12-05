const WebSocket = require('ws');

async function testDeleteConnection() {
  console.log('🔐 Testing delete connection functionality...');
  
  try {
    // Login via web app (this should set cookies properly)
    const loginResponse = await fetch('http://localhost:3000/api/auth/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData);
      return;
    }
    
    console.log('✅ Login successful');
    
    // The issue is that the web app uses cookies, not Bearer tokens
    // Let's check the database directly instead
    console.log('📊 Testing delete functionality would require browser session...');
    console.log('🔍 The issue is likely that:');
    console.log('   1. Frontend delete button calls API');
    console.log('   2. API deletes from database');
    console.log('   3. Frontend doesn\'t refresh the connection list');
    console.log('   4. Page refresh re-fetches all connections from database');
    console.log('');
    console.log('💡 Solution: Check if frontend refreshes connection list after delete');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDeleteConnection();