const WebSocket = require('ws');

async function testWebSocketConnection() {
  console.log('🔐 Logging in to SSH Manager...');
  
  // Login to get fresh token
  const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  
  const loginResult = await loginResponse.json();
  if (!loginResult.success) {
    console.error('❌ Login failed:', loginResult.error);
    return;
  }
  
  console.log('✅ Login successful');
  const token = loginResult.token;
  
  // Create Ubuntu connection with internal IP
  console.log('📡 Creating Ubuntu connection...');
  const connResponse = await fetch('http://localhost:3000/api/ssh/connections/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      host: '172.19.0.7',  // Internal Docker IP
      port: 22,
      username: 'ubuntu',
      password: 'ubuntu123',
      name: 'Ubuntu-Internal-Test'
    })
  });
  
  const connResult = await connResponse.json();
  if (!connResult.success) {
    console.error('❌ Connection creation failed:', connResult);
    return;
  }
  
  console.log('✅ Connection created:', connResult.connection.id);
  
  // Test WebSocket terminal connection
  console.log('🔌 Testing WebSocket terminal...');
  const ws = new WebSocket('ws://localhost:3001');
  
  ws.on('open', function open() {
    console.log('✅ WebSocket connected');
    
    // Authenticate
    ws.send(JSON.stringify({
      type: 'auth',
      token: token
    }));
    
    setTimeout(() => {
      console.log('🔗 Attempting SSH connection...');
      ws.send(JSON.stringify({
        type: 'connect',
        connectionId: connResult.connection.id,
        cols: 80,
        rows: 24
      }));
    }, 1000);
  });
  
  let connected = false;
  let hasOutput = false;
  
  ws.on('message', function message(data) {
    try {
      const msg = JSON.parse(data);
      
      if (msg.type === 'auth_success') {
        console.log('🔐 WebSocket authentication successful');
      }
      
      if (msg.type === 'connected') {
        console.log('🎉 SSH connection established!');
        connected = true;
        
        // Send a test command
        setTimeout(() => {
          console.log('📤 Sending test command...');
          ws.send(JSON.stringify({
            type: 'data',
            data: 'echo "Ubuntu Terminal Working!" && whoami && hostname\r'
          }));
        }, 500);
        
        // Close after a few seconds
        setTimeout(() => {
          console.log('🔌 Closing connection...');
          ws.close();
        }, 3000);
      }
      
      if (msg.type === 'error') {
        console.error('❌ SSH Error:', msg.message);
        ws.close();
      }
      
      if (msg.type === 'data' && connected) {
        const output = msg.data.replace(/\x1b\[[0-9;]*m/g, '').replace(/\r?\n/g, ' ').trim();
        if (output && !output.includes('[?25h') && !output.includes('$') && output.length > 3) {
          console.log('📺 Terminal Output:', output);
          hasOutput = true;
        }
      }
    } catch (e) {
      // Ignore non-JSON messages
    }
  });
  
  ws.on('error', function error(err) {
    console.error('❌ WebSocket error:', err.message);
  });
  
  ws.on('close', function close() {
    console.log('🔌 WebSocket connection closed');
    if (connected && hasOutput) {
      console.log('🎉 Ubuntu terminal test SUCCESSFUL! ✅');
    } else if (connected) {
      console.log('⚠️ SSH connected but no output received');
    } else {
      console.log('❌ Ubuntu terminal test FAILED');
    }
    process.exit(0);
  });
  
  // Timeout after 10 seconds
  setTimeout(() => {
    if (!connected) {
      console.log('⏰ Connection timeout - closing WebSocket');
      ws.close();
    }
  }, 10000);
}

testWebSocketConnection();