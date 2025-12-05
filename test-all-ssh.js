const WebSocket = require('ws');

async function testAllSSHServers() {
  console.log('🚀 TESTING ALL SSH SERVERS FOR SSH MANAGER');
  console.log('==========================================\n');
  
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4MzQ5MmVjZS0wYWUxLTQ1ZDgtYTQ4Ni1lMzljZmE0OGNmYjUiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBzc2htYW5hZ2VyLmxvY2FsIiwiaWF0IjoxNzY0NjQ1Mjc1LCJleHAiOjE3NjUyNTAwNzUsImF1ZCI6InNzaC1tYW5hZ2VyLXVzZXJzIiwiaXNzIjoic3NoLW1hbmFnZXIifQ.mAQc_JNYr2TAV3cVtyYnZiwL3Upbf4XfUlhROSNp3YE';
  
  const servers = [
    {
      name: 'Alpine Linux',
      host: '172.19.0.6',
      user: 'alpine',
      connectionId: '6139ba18-2657-4fc0-a723-f0758b7bb5ca',
      description: 'Lightweight Alpine Linux server'
    },
    {
      name: 'Ubuntu Server',
      host: '172.19.0.7', 
      user: 'ubuntu',
      connectionId: '809c7831-ee80-43f8-8583-deb668f9c2c2',
      description: 'Full Ubuntu 22.04 server'
    },
    {
      name: 'Debian Server',
      host: '172.19.0.10',
      user: 'debian', 
      connectionId: '049ff87b-9c38-4f14-99b1-97a58075b4d3',
      description: 'Debian 12 stable server'
    },
    {
      name: 'Custom Test Server',
      host: '172.19.0.9',
      user: 'tester',
      connectionId: 'fedd2a6b-e739-48c1-9b54-dd09d240b6fd',
      description: 'Custom Ubuntu 20.04 with testing tools'
    }
  ];
  
  const results = [];
  
  for (const server of servers) {
    console.log(`🧪 Testing ${server.name} (${server.host})...`);
    
    const result = await new Promise((resolve) => {
      const ws = new WebSocket('ws://localhost:3001');
      const startTime = Date.now();
      
      let connected = false;
      let authSuccess = false;
      let terminalOutput = [];
      
      ws.on('open', function open() {
        ws.send(JSON.stringify({
          type: 'auth',
          token: token
        }));
        
        setTimeout(() => {
          ws.send(JSON.stringify({
            type: 'connect',
            connectionId: server.connectionId,
            cols: 80,
            rows: 24
          }));
        }, 500);
      });
      
      ws.on('message', function message(data) {
        try {
          const msg = JSON.parse(data);
          
          if (msg.type === 'auth_success') {
            authSuccess = true;
          }
          
          if (msg.type === 'connected') {
            connected = true;
            console.log(`  ✅ SSH connection established`);
            
            // Ejecutar comandos de prueba
            setTimeout(() => {
              ws.send(JSON.stringify({
                type: 'data', 
                data: `echo "=== ${server.name} Test ===" && hostname && whoami && uname -a && echo "Test Complete"\r`
              }));
            }, 500);
            
            setTimeout(() => {
              ws.close();
            }, 3000);
          }
          
          if (msg.type === 'error') {
            resolve({
              server: server.name,
              success: false,
              error: msg.message,
              duration: Date.now() - startTime
            });
          }
          
          if (msg.type === 'data' && connected) {
            const output = msg.data.replace(/\x1b\[[0-9;]*m/g, '').trim();
            if (output && !output.includes('[?25h') && output.length > 2) {
              terminalOutput.push(output);
            }
          }
        } catch (e) {
          // Ignorar mensajes no JSON
        }
      });
      
      ws.on('error', function error(err) {
        resolve({
          server: server.name,
          success: false,
          error: err.message,
          duration: Date.now() - startTime
        });
      });
      
      ws.on('close', function close() {
        if (connected) {
          resolve({
            server: server.name,
            host: server.host,
            user: server.user,
            description: server.description,
            success: true,
            authSuccess: authSuccess,
            connected: connected,
            output: terminalOutput.join(' '),
            duration: Date.now() - startTime
          });
        }
      });
      
      setTimeout(() => {
        if (!connected) {
          ws.close();
          resolve({
            server: server.name,
            success: false,
            error: 'Connection timeout',
            duration: Date.now() - startTime
          });
        }
      }, 8000);
    });
    
    results.push(result);
    
    if (result.success) {
      console.log(`  ✅ ${result.server} - SUCCESS (${result.duration}ms)`);
    } else {
      console.log(`  ❌ ${result.server} - FAILED: ${result.error}`);
    }
    console.log('');
  }
  
  // Generar reporte final
  console.log('📊 FINAL TEST REPORT');
  console.log('===================\n');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful connections: ${successful.length}/${results.length}`);
  console.log(`❌ Failed connections: ${failed.length}/${results.length}\n`);
  
  if (successful.length > 0) {
    console.log('🎉 WORKING SSH SERVERS FOR SSH MANAGER:');
    console.log('=====================================');
    successful.forEach(result => {
      console.log(`📡 ${result.server}`);
      console.log(`   Host: ${result.host} (Internal IP)`);
      console.log(`   User: ${result.user}`);
      console.log(`   Description: ${result.description}`);
      console.log(`   Connection Time: ${result.duration}ms`);
      if (result.output) {
        console.log(`   Sample Output: ${result.output.substring(0, 100)}...`);
      }
      console.log('');
    });
    
    console.log('🔗 FOR USE IN SSH MANAGER APPLICATION:');
    console.log('====================================');
    successful.forEach(result => {
      console.log(`• ${result.server}:`);
      console.log(`  Host: ${result.host}`);
      console.log(`  Port: 22`);
      console.log(`  Username: ${result.user}`);
      console.log(`  Password: [check SSH_TEST_SERVERS.md for passwords]`);
      console.log('');
    });
  }
  
  if (failed.length > 0) {
    console.log('❌ FAILED SERVERS:');
    console.log('================');
    failed.forEach(result => {
      console.log(`• ${result.server}: ${result.error}`);
    });
  }
  
  console.log(`\n🎯 You now have ${successful.length} working SSH servers to test your SSH Manager!`);
  process.exit(0);
}

testAllSSHServers();