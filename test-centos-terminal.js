const WebSocket = require('ws');

async function testCentOSTerminal() {
  console.log('🧪 Testing CentOS Terminal via localhost:2202...');
  
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4MzQ5MmVjZS0wYWUxLTQ1ZDgtYTQ4Ni1lMzljZmE0OGNmYjUiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBzc2htYW5hZ2VyLmxvY2FsIiwiaWF0IjoxNzY0Njk5OTMzLCJleHAiOjE3NjUzMDQ3MzMsImF1ZCI6InNzaC1tYW5hZ2VyLXVzZXJzIiwiaXNzIjoic3NoLW1hbmFnZXIifQ.Tq07_JNYr2TAV3cVtyYnZiwL3Upbf4XfUlhROSNp3YE';
  const connectionId = 'e9a85ac8-48e8-4a19-9f8e-d80f4e44a635';
  
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
        connectionId: connectionId,
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
        console.log('✅ CentOS SSH connection established!');
        connected = true;
        
        setTimeout(() => {
          ws.send(JSON.stringify({
            type: 'data',
            data: 'echo "CentOS Terminal Working!" && cat /etc/motd && whoami && hostname\r'
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
      console.log('🎉 CentOS terminal test SUCCESSFUL!');
    } else {
      console.log('❌ CentOS terminal test FAILED');
    }
    process.exit(0);
  });
  
  setTimeout(() => {
    if (!connected) {
      console.log('⏰ Connection timeout');
      ws.close();
    }
  }, 10000);
}

testCentOSTerminal();