const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer } = require('ws');
const { Client: SSHClient } = require('ssh2');
const { Pool } = require('pg');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);
const wsPort = parseInt(process.env.WEBSOCKET_PORT || '3001', 10);

// Crear app Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Database connection
const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// SSH Sessions activas
const activeSessions = new Map();

app.prepare().then(() => {
  // Servidor HTTP principal de Next.js
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Servidor WebSocket separado para terminales
  const wss = new WebSocketServer({ 
    port: wsPort,
    perMessageDeflate: false 
  });

  console.log(`🚀 SSH Manager starting...`);
  console.log(`📡 WebSocket server will start on port ${wsPort}`);

  wss.on('connection', async (ws, req) => {
    console.log('📱 New WebSocket connection');
    
    let isAuthenticated = false;
    let userId = null;

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('📨 WebSocket message:', data.type);

        switch (data.type) {
          case 'auth':
            // Por simplicidad, vamos a aceptar cualquier token por ahora
            // En producción, aquí verificarías el token JWT
            isAuthenticated = true;
            userId = 'e11af4ab-a61f-4c27-8dad-1a3d07d0d49f'; // Usuario demo
            
            ws.send(JSON.stringify({
              type: 'auth_success',
              message: 'Authentication successful'
            }));
            break;

          case 'connect':
            if (!isAuthenticated) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Not authenticated'
              }));
              return;
            }

            try {
              // Obtener detalles de conexión desde la base de datos
              const result = await dbPool.query(
                'SELECT * FROM ssh_connections WHERE id = $1 AND user_id = $2',
                [data.connectionId, userId]
              );

              if (result.rows.length === 0) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Connection not found'
                }));
                return;
              }

              const connection = result.rows[0];
              console.log(`🔗 Connecting to ${connection.host}:${connection.port} as ${connection.username}`);

              // Crear cliente SSH real
              const sshClient = new SSHClient();
              const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              
              let sshStream = null;

              sshClient.on('ready', () => {
                console.log(`✅ SSH Client ready for ${connection.host}`);
                
                // Crear shell interactivo
                sshClient.shell({
                  rows: data.rows || 24,
                  cols: data.cols || 80,
                  term: 'xterm-256color'
                }, (err, stream) => {
                  if (err) {
                    console.error('❌ SSH Shell error:', err);
                    ws.send(JSON.stringify({
                      type: 'error',
                      message: 'Failed to create SSH shell'
                    }));
                    sshClient.end();
                    return;
                  }

                  sshStream = stream;
                  console.log(`🖥️ SSH Shell created for ${connection.host}`);

                  // Guardar sesión activa
                  activeSessions.set(sessionId, {
                    userId,
                    connectionId: data.connectionId,
                    sshClient,
                    sshStream: stream,
                    connection,
                    connected: true,
                    startTime: new Date()
                  });

                  // Enviar confirmación de conexión
                  ws.send(JSON.stringify({
                    type: 'connected',
                    message: `SSH connection established to ${connection.host}`,
                    sessionId: sessionId
                  }));

                  // Reenviar datos del SSH al WebSocket
                  stream.on('data', (data) => {
                    ws.send(JSON.stringify({
                      type: 'data',
                      data: data.toString()
                    }));
                  });

                  stream.on('close', () => {
                    console.log(`🔌 SSH Stream closed for ${connection.host}`);
                    ws.send(JSON.stringify({
                      type: 'close',
                      message: 'SSH connection closed'
                    }));
                    activeSessions.delete(sessionId);
                  });

                  stream.stderr.on('data', (data) => {
                    ws.send(JSON.stringify({
                      type: 'data',
                      data: data.toString()
                    }));
                  });
                });
              });

              sshClient.on('error', (err) => {
                console.error(`❌ SSH Client error for ${connection.host}:`, err.message);
                ws.send(JSON.stringify({
                  type: 'error',
                  message: `SSH connection failed: ${err.message}`
                }));
                activeSessions.delete(sessionId);
              });

              sshClient.on('close', () => {
                console.log(`🔌 SSH Client closed for ${connection.host}`);
                activeSessions.delete(sessionId);
              });

              // Conectar SSH
              const sshConfig = {
                host: connection.host,
                port: connection.port || 22,
                username: connection.username,
                timeout: 30000,
                readyTimeout: 30000,
                keepaliveInterval: 60000
              };

              // Agregar método de autenticación
              if (connection.private_key) {
                // Autenticación por clave privada
                sshConfig.privateKey = connection.decrypted_private_key || connection.private_key;
                if (connection.passphrase) {
                  sshConfig.passphrase = connection.decrypted_passphrase || connection.passphrase;
                }
              } else if (connection.password) {
                // Autenticación por contraseña
                sshConfig.password = connection.decrypted_password || connection.password;
              }

              sshClient.connect(sshConfig);

            } catch (error) {
              console.error('SSH connection error:', error);
              ws.send(JSON.stringify({
                type: 'error',
                message: `Failed to connect: ${error.message}`
              }));
            }
            break;

          case 'data':
            if (isAuthenticated && data.sessionId) {
              const session = activeSessions.get(data.sessionId);
              if (session && session.sshStream && session.connected) {
                // Enviar datos directamente al stream SSH
                session.sshStream.write(data.data);
              } else {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'No active SSH session found'
                }));
              }
            }
            break;

          case 'resize':
            if (isAuthenticated && data.sessionId) {
              const session = activeSessions.get(data.sessionId);
              if (session && session.sshStream && session.connected) {
                console.log(`📐 Terminal resized: ${data.cols}x${data.rows} for ${session.connection.host}`);
                session.sshStream.setWindow(data.rows, data.cols);
              }
            }
            break;

          case 'disconnect':
            if (data.sessionId) {
              const session = activeSessions.get(data.sessionId);
              if (session) {
                console.log(`🔌 Disconnecting SSH session for ${session.connection.host}`);
                
                // Cerrar stream SSH
                if (session.sshStream) {
                  session.sshStream.end();
                }
                
                // Cerrar cliente SSH
                if (session.sshClient) {
                  session.sshClient.end();
                }
                
                // Remover sesión
                activeSessions.delete(data.sessionId);
                
                ws.send(JSON.stringify({
                  type: 'close',
                  message: 'SSH session closed'
                }));
              }
            }
            break;

          default:
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Unknown message type'
            }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', async () => {
      console.log('📱 WebSocket connection closed');
      
      // Cerrar todas las sesiones SSH del usuario
      for (const [sessionId, session] of activeSessions.entries()) {
        if (session.userId === userId) {
          console.log(`🔌 Closing SSH session ${sessionId} for user ${userId}`);
          
          if (session.sshStream) {
            session.sshStream.end();
          }
          
          if (session.sshClient) {
            session.sshClient.end();
          }
          
          activeSessions.delete(sessionId);
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Enviar mensaje de bienvenida
    ws.send(JSON.stringify({
      type: 'welcome',
      message: 'SSH Terminal WebSocket Server Ready'
    }));
  });

  // Iniciar servidor HTTP
  server
    .once('error', (err) => {
      console.error('❌ HTTP Server Error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`✅ HTTP Server ready on http://${hostname}:${port}`);
    });

  // Iniciar servidor WebSocket
  wss.on('listening', () => {
    console.log(`✅ WebSocket Server ready on ws://${hostname}:${wsPort}`);
  });

  wss.on('error', (err) => {
    console.error('❌ WebSocket Server Error:', err);
  });

  // Manejo de señales de terminación
  process.on('SIGTERM', async () => {
    console.log('🔄 Shutting down gracefully...');
    server.close();
    wss.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('🔄 Shutting down gracefully...');
    server.close();
    wss.close();
    process.exit(0);
  });
});