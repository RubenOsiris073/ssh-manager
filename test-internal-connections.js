const WebSocket = require('ws');

async function testInternalIPConnections() {
  console.log('🧪 Testing SSH Connections with Internal IPs...');
  
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4MzQ5MmVjZS0wYWUxLTQ1ZDgtYTQ4Ni1lMzljZmE0OGNmYjUiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBzc2htYW5hZ2VyLmxvY2FsIiwiaWF0IjoxNzY0NjQ1Mjc1LCJleHAiOjE3NjUyNTAwNzUsImF1ZCI6InNzaC1tYW5hZ2VyLXVzZXJzIiwiaXNzIjoic3NoLW1hbmFnZXIifQ.mAQc_JNYr2TAV3cVtyYnZiwL3Upbf4XfUlhROSNp3YE';
  
  const connections = [
    { name: 'Alpine (172.19.0.6)', id: '6139ba18-2657-4fc0-a723-f0758b7bb5ca' },
    { name: 'Ubuntu (172.19.0.7)', id: '809c7831-ee80-43f8-8583-deb668f9c2c2' }
  ];
  
  for (const conn of connections) {
    console.log(`\n🔌 Testing ${conn.name} SSH Terminal...`);
    
    const ws = new WebSocket('ws://localhost:3001');
    
    await new Promise((resolve) => {
      ws.on('open', function open() {
        console.log(`✅ WebSocket connected for ${conn.name}`);
        
        ws.send(JSON.stringify({
          type: 'auth',
          token: token
        }));
        
        setTimeout(() => {
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
            
            setTimeout(() => {
              ws.send(JSON.stringify({
                type: 'data',
                data: `echo "Testing ${conn.name}" && hostname && whoami && echo "SSH Working!"\r`
              }));
            }, 500);
            
            setTimeout(() => {
              console.log(`🔌 ${conn.name} - Test completed, disconnecting...`);
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
            const output = msg.data.replace(/\r?\n/g, ' ').replace(/\x1b\[[0-9;]*m/g, '').trim();
            if (output && !output.includes('[?25h') && !output.includes('$') && output.length > 3) {
              console.log(`📺 ${conn.name}:`, output);
            }
          }
        } catch (e) {
          // Ignorar mensajes no JSON
        }
      });
      
      ws.on('error', function error(err) {
        console.error(`❌ ${conn.name} - WebSocket error:`, err.message);
        resolve();
      });
      
      ws.on('close', function close() {
        console.log(`🔌 ${conn.name} - Connection closed`);
        if (!connected) resolve();
      });
      
      setTimeout(() => {
        if (!connected) {
          console.log(`⏰ ${conn.name} - Timeout`);
          ws.close();
          resolve();
        }
      }, 8000);
    });
  }
  
  console.log('\n🎉 All SSH Terminal Tests Completed!');
  process.exit(0);
}

testInternalIPConnections();