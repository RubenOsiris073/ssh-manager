const WebSocket = require('ws');

async function testCentOSInternalIP() {
  console.log('🧪 Testing CentOS Terminal via 172.19.0.4...');
  
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4MzQ5MmVjZS0wYWUxLTQ1ZDgtYTQ4Ni1lMzljZmE0OGNmYjUiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBzc2htYW5hZ2VyLmxvY2FsIiwiaWF0IjoxNzY0Njk5OTMzLCJleHAiOjE3NjUzMDQ3MzMsImF1ZCI6InNzaC1tYW5hZ2VyLXVzZXJzIiwiaXNzIjoic3NoLW1hbmFnZXIifQ.Tq07_JNYr2TAV3cVtyYnZiwL3Upbf4XfUlhROSNp3YE';
  
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
    console.log('✅ Quick Connect successful, testing WebSocket...');
    
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
          connectionId: result.connectionId,
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
          console.log('🔐 Authentication successful');
        }
        
        if (msg.type === 'connected') {
          console.log('✅ CentOS SSH connection established via internal IP!');
          connected = true;
          
          setTimeout(() => {
            ws.send(JSON.stringify({
              type: 'data',
              data: 'echo "CentOS Internal Terminal Working!" && whoami\r'
            }));
          }, 500);
          
          setTimeout(() => {
            console.log('🔌 Closing connection...');
            ws.close();
          }, 4000);
        }
        
        if (msg.type === 'error') {
          console.error('❌ Error:', msg.message);
          ws.close();
        }
        
        if (msg.type === 'data' && connected) {
          const output = msg.data.replace(/\x1b\[[0-9;]*m/g, '').replace(/\r?\n/g, ' ').trim();
          if (output && !output.includes('[?25h') && output.length > 3) {
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
    console.error('❌ Quick Connect failed:', result);
    process.exit(1);
  }
}

testCentOSInternalIP();