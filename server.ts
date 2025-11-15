import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';
import { SSHTerminalManager } from './lib/ssh/terminal-manager';
import { AuthService } from './lib/auth/jwt';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);
const wsPort = parseInt(process.env.WEBSOCKET_PORT || '3001', 10);

// Crear app Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Gestor de terminales SSH
const terminalManager = new SSHTerminalManager();

app.prepare().then(() => {
  // Servidor HTTP principal de Next.js
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
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
    
    let terminalSession: any = null;
    let isAuthenticated = false;
    let userId: string | null = null;

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('📨 WebSocket message:', data.type);

        switch (data.type) {
          case 'auth':
            try {
              const payload = AuthService.verifyToken(data.token);
              userId = payload.userId;
              isAuthenticated = true;
              
              ws.send(JSON.stringify({
                type: 'auth_success',
                message: 'Authentication successful'
              }));
            } catch (error) {
              ws.send(JSON.stringify({
                type: 'auth_error',
                message: 'Authentication failed'
              }));
            }
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
              terminalSession = await terminalManager.createSession(
                userId!,
                data.connectionId,
                {
                  cols: data.cols || 80,
                  rows: data.rows || 24
                }
              );

              // Configurar eventos del terminal
              terminalSession.onData((data: string) => {
                ws.send(JSON.stringify({
                  type: 'data',
                  data: data
                }));
              });

              terminalSession.onClose(() => {
                ws.send(JSON.stringify({
                  type: 'close',
                  message: 'SSH connection closed'
                }));
              });

              terminalSession.onError((error: Error) => {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: error.message
                }));
              });

              ws.send(JSON.stringify({
                type: 'connected',
                message: 'SSH connection established',
                sessionId: terminalSession.id
              }));

            } catch (error) {
              console.error('SSH connection error:', error);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to connect to SSH server'
              }));
            }
            break;

          case 'data':
            if (terminalSession && isAuthenticated) {
              terminalSession.write(data.data);
            }
            break;

          case 'resize':
            if (terminalSession && isAuthenticated) {
              terminalSession.resize(data.cols, data.rows);
            }
            break;

          case 'disconnect':
            if (terminalSession) {
              await terminalManager.closeSession(terminalSession.id);
              terminalSession = null;
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
      if (terminalSession) {
        await terminalManager.closeSession(terminalSession.id);
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
    
    // Cerrar todas las sesiones SSH
    await terminalManager.closeAllSessions();
    
    // Cerrar servidores
    server.close();
    wss.close();
    
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('🔄 Shutting down gracefully...');
    
    await terminalManager.closeAllSessions();
    server.close();
    wss.close();
    
    process.exit(0);
  });
});