const WebSocket = require('ws');

async function testMultipleSSHConnections() {
  console.log('🧪 Testing SSH Terminal Connections...');
  
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4MzQ5MmVjZS0wYWUxLTQ1ZDgtYTQ4Ni1lMzljZmE0OGNmYjUiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBzc2htYW5hZ2VyLmxvY2FsIiwiaWF0IjoxNzY0NjQ1MjAyLCJleHAiOjE3NjUyNTAwMDIsImF1ZCI6InNzaC1tYW5hZ2VyLXVzZXJzIiwiaXNzIjoic3NoLW1hbmFnZXIifQ.Z7bb_JNYr2TAV3cVtyYnZiwL3Upbf4XfUlhROSNp3YE';
  
  // IDs de las conexiones creadas
  const connections = [
    { name: 'Alpine', id: 'aba54bea-0a64-4f14-bad2-9e190ecbaa41' },
    { name: 'Ubuntu', id: '4881a6bb-af05-4935-bc0f-7d122f3d14b6' }
  ];
  
  for (const conn of connections) {
    console.log(`\n🔌 Testing ${conn.name} SSH Terminal...`);
    
    const ws = new WebSocket('ws://localhost:3001');
    
    await new Promise((resolve) => {
      ws.on('open', function open() {
        console.log(`✅ WebSocket connected for ${conn.name}`);
        
        // Autenticar
        ws.send(JSON.stringify({
          type: 'auth',
          token: token
        }));
        
        setTimeout(() => {
          // Conectar
          ws.send(JSON.stringify({
            type: 'connect',
            connectionId: conn.id,
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
            console.log(`🔐 ${conn.name} - Authentication successful`);
          }
          
          if (msg.type === 'connected') {
            console.log(`✅ ${conn.name} - SSH connection established!`);
            connected = true;
            
            // Enviar comando de prueba
            setTimeout(() => {
              ws.send(JSON.stringify({
                type: 'data',
                data: `echo "${conn.name} SSH Terminal Working!" && hostname && whoami\r`
              }));
            }, 500);
            
            // Cerrar después de 3 segundos
            setTimeout(() => {
              console.log(`🔌 ${conn.name} - Disconnecting...`);
              ws.close();
              resolve();
            }, 3000);
          }
          
          if (msg.type === 'error') {
            console.error(`❌ ${conn.name} - Error:`, msg.message);
            ws.close();
            resolve();
          }
          
          if (msg.type === 'data' && connected) {
            // Mostrar output del terminal
            const output = msg.data.replace(/\r?\n/g, ' ').trim();
            if (output && !output.includes('[?25h')) {
              console.log(`📺 ${conn.name} Output:`, output);
            }
          }
        } catch (e) {
          // Ignorar mensajes que no son JSON
        }
      });
      
      ws.on('error', function error(err) {
        console.error(`❌ ${conn.name} - WebSocket error:`, err.message);
        resolve();
      });
      
      ws.on('close', function close() {
        console.log(`🔌 ${conn.name} - WebSocket closed`);
        if (!connected) resolve();
      });
      
      // Timeout después de 10 segundos
      setTimeout(() => {
        if (!connected) {
          console.log(`⏰ ${conn.name} - Connection timeout`);
          ws.close();
          resolve();
        }
      }, 10000);
    });
  }
  
  console.log('\n🎉 SSH Connection Tests Completed!');
  process.exit(0);
}

testMultipleSSHConnections();