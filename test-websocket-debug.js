const WebSocket = require('ws');

async function testSSHManagerWebSocket() {
  try {
    console.log('🔐 Starting WebSocket SSH test...');
    
    // Connect to WebSocket
    const ws = new WebSocket('ws://localhost:3001');
    let authenticated = false;
    let connectionAttempted = false;
    
    ws.on('open', function open() {
      console.log('✅ WebSocket connection opened');
      
      // Send auth (assuming we have a token)
      ws.send(JSON.stringify({
        type: 'auth',
        token: 'dummy-token-for-test'
      }));
    });
    
    ws.on('message', function message(data) {
      try {
        const msg = JSON.parse(data);
        console.log('📨 WebSocket message:', msg.type, msg.message || '');
        
        if (msg.type === 'auth_success') {
          console.log('✅ Authentication successful');
          authenticated = true;
          
          // Try to connect to a server
          console.log('🔗 Attempting SSH connection...');
          connectionAttempted = true;
          ws.send(JSON.stringify({
            type: 'connect',
            host: '172.19.0.11',
            port: 22,
            username: 'tester',
            password: 'test123',
            cols: 80,
            rows: 24
          }));
        }
        
        if (msg.type === 'connected') {
          console.log('🎉 SSH connection successful!');
          
          // Send a test command
          setTimeout(() => {
            ws.send(JSON.stringify({
              type: 'data',
              data: 'echo "WebSocket SSH Working!"\r'
            }));
          }, 500);
          
          setTimeout(() => ws.close(), 3000);
        }
        
        if (msg.type === 'error') {
          console.error('❌ Error:', msg.message);
        }
        
        if (msg.type === 'auth_error') {
          console.log('⚠️ Auth error, trying without token...');
          
          // Try direct connection without auth
          console.log('🔗 Attempting direct SSH connection...');
          connectionAttempted = true;
          ws.send(JSON.stringify({
            type: 'connect',
            host: '172.19.0.11',
            port: 22,
            username: 'tester', 
            password: 'test123',
            cols: 80,
            rows: 24
          }));
        }
      } catch (e) {
        console.log('📨 Non-JSON message received');
      }
    });
    
    ws.on('error', function error(err) {
      console.error('❌ WebSocket error:', err.message);
    });
    
    ws.on('close', function close() {
      console.log('🔌 WebSocket closed');
      if (!authenticated && !connectionAttempted) {
        console.log('❌ Failed to authenticate or connect');
      }
      process.exit(0);
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      console.log('⏰ Test timeout');
      ws.close();
    }, 10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSSHManagerWebSocket();