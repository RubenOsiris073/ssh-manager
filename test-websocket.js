const WebSocket = require('ws');

async function testWebSocketConnection() {
  console.log('🧪 Testing WebSocket connection with decryption fix...');
  
  // Simular un token válido (tomado de los logs de login)
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4MzQ5MmVjZS0wYWUxLTQ1ZDgtYTQ4Ni1lMzljZmE0OGNmYjUiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBzc2htYW5hZ2VyLmxvY2FsIiwiaWF0IjoxNzYzNjY5Njk0LCJleHAiOjE3NjQyNzQ0OTQsImF1ZCI6InNzaC1tYW5hZ2VyLXVzZXJzIiwiaXNzIjoic3NoLW1hbmFnZXIifQ.DSIe_JNYr2TAV3cVtyYnZiwL3Upbf4XfUlhROSNp3YE';
  
  // ID de conexión creada (tomado de los logs)
  const connectionId = '832781a1-570b-47a4-9309-fb58f89b2590';
  
  const ws = new WebSocket('ws://localhost:3001');
  
  ws.on('open', function open() {
    console.log('✅ WebSocket connected');
    
    // 1. Autenticar
    console.log('🔐 Sending auth...');
    ws.send(JSON.stringify({
      type: 'auth',
      token: token
    }));
    
    // 2. Conectar después de un pequeño delay
    setTimeout(() => {
      console.log('🔗 Sending connect...');
      ws.send(JSON.stringify({
        type: 'connect',
        connectionId: connectionId,
        cols: 80,
        rows: 24
      }));
    }, 1000);
  });
  
  ws.on('message', function message(data) {
    try {
      const msg = JSON.parse(data);
      console.log('📨 Received:', msg.type, msg.message || '');
      
      if (msg.type === 'error') {
        console.error('❌ WebSocket error:', msg.message);
      }
      
      if (msg.type === 'ready') {
        console.log('✅ SSH connection ready! Sending test command...');
        ws.send(JSON.stringify({
          type: 'data',
          data: 'echo "Decryption test successful!"\r'
        }));
        
        // Desconectar después de 3 segundos
        setTimeout(() => {
          console.log('🔌 Disconnecting...');
          ws.close();
        }, 3000);
      }
    } catch (e) {
      console.log('📨 Raw message:', data.toString());
    }
  });
  
  ws.on('error', function error(err) {
    console.error('❌ WebSocket error:', err);
  });
  
  ws.on('close', function close() {
    console.log('🔌 WebSocket closed');
    process.exit(0);
  });
}

testWebSocketConnection();