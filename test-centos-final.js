const WebSocket = require('ws');

async function loginAndTestCentOS() {
  console.log('🔐 Logging in first...');
  
  // Login
  const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    })
  });
  
  const loginResult = await loginResponse.json();
  console.log('📝 Login result:', loginResult.success ? 'SUCCESS' : loginResult.error);
  console.log('🔑 Token:', loginResult.token ? 'RECEIVED' : 'MISSING');
  
  if (!loginResult.success) {
    console.error('❌ Login failed');
    process.exit(1);
  }
  
  const token = loginResult.token;
  
  console.log('🧪 Testing CentOS Terminal via 172.19.0.4...');
  
  // Crear conexión con IP interna
  const response = await fetch('http://localhost:3000/api/ssh/connections/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      host: '172.19.0.4',
      port: 22,
      username: 'centos',
      password: 'centos123',
      name: 'CentOS-Internal-Test'
    })
  });
  
  const result = await response.json();
  console.log('📡 API Response:', result);
  
  if (result.success) {
    console.log('✅ Connection created, testing WebSocket...');
    
    const ws = new WebSocket('ws://localhost:3001');
    
    ws.on('open', function open() {
      console.log('✅ WebSocket connected');
      
      ws.send(JSON.stringify({
        type: 'auth',
        token: token
      }));
      
      setTimeout(() => {
        console.log('🔗 Attempting CentOS SSH connection...');
        ws.send(JSON.stringify({
          type: 'connect',
          connectionId: result.connection.id,
          cols: 80,
          rows: 24
        }));
      }, 1000);
    });
    
    let connected = false;
    ws.on('message', function message(data) {
      try {
        const msg = JSON.parse(data);
        
        if (msg.type === 'auth_success') {
          console.log('🔐 WebSocket authentication successful');
        }
        
        if (msg.type === 'connected') {
          console.log('🎉 CentOS SSH connection established via internal IP!');
          connected = true;
          
          setTimeout(() => {
            ws.send(JSON.stringify({
              type: 'data',
              data: 'echo "CentOS Internal Terminal Working!" && whoami && echo "Success!"\r'
            }));
          }, 500);
          
          setTimeout(() => {
            console.log('🔌 Closing connection...');
            ws.close();
          }, 4000);
        }
        
        if (msg.type === 'error') {
          console.error('❌ WebSocket Error:', msg.message);
          ws.close();
        }
        
        if (msg.type === 'data' && connected) {
          const output = msg.data.replace(/\x1b\[[0-9;]*m/g, '').replace(/\r?\n/g, ' ').trim();
          if (output && !output.includes('[?25h') && !output.includes('$') && output.length > 3) {
            console.log('📺 CentOS Output:', output);
          }
        }
      } catch (e) {
        // Ignorar mensajes no JSON
      }
    });
    
    ws.on('error', function error(err) {
      console.error('❌ WebSocket error:', err.message);
    });
    
    ws.on('close', function close() {
      console.log('🔌 Connection closed');
      if (connected) {
        console.log('🎉 CentOS internal IP test SUCCESSFUL!');
      } else {
        console.log('❌ CentOS internal IP test FAILED');
      }
      process.exit(0);
    });
    
    setTimeout(() => {
      if (!connected) {
        console.log('⏰ Connection timeout');
        ws.close();
      }
    }, 10000);
  } else {
    console.error('❌ Connection creation failed:', result);
    process.exit(1);
  }
}

loginAndTestCentOS();