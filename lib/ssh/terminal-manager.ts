import { Client } from 'ssh2';
import { EventEmitter } from 'events';
import { getDB } from '@/lib/database/postgresql';

export interface SSHSession {
  id: string;
  userId: string;
  connectionId: string;
  client: Client;
  stream?: any;
  isConnected: boolean;
  createdAt: Date;
  lastActivity: Date;
}

export interface TerminalOptions {
  cols: number;
  rows: number;
  term?: string;
}

export class SSHTerminalSession extends EventEmitter {
  public id: string;
  public userId: string;
  public connectionId: string;
  private client: Client;
  private stream?: any;
  private isConnected: boolean = false;
  private lastActivity: Date;

  constructor(
    id: string,
    userId: string,
    connectionId: string,
    client: Client
  ) {
    super();
    this.id = id;
    this.userId = userId;
    this.connectionId = connectionId;
    this.client = client;
    this.lastActivity = new Date();
  }

  async connect(connectionConfig: any, terminalOptions: TerminalOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.connect({
        host: connectionConfig.host,
        port: connectionConfig.port || 22,
        username: connectionConfig.username,
        password: connectionConfig.password,
        privateKey: connectionConfig.private_key ? Buffer.from(connectionConfig.private_key) : undefined,
        readyTimeout: 30000,
        algorithms: {
          kex: [
            'ecdh-sha2-nistp256',
            'ecdh-sha2-nistp384',
            'ecdh-sha2-nistp521',
            'diffie-hellman-group14-sha256'
          ]
        }
      });

      this.client.on('ready', () => {
        console.log(`✅ SSH connection ready: ${connectionConfig.host}`);
        
        // Crear shell con PTY
        this.client.shell({
          cols: terminalOptions.cols,
          rows: terminalOptions.rows,
          term: terminalOptions.term || 'xterm-256color'
        }, (err, stream) => {
          if (err) {
            console.error('❌ Shell creation error:', err);
            reject(err);
            return;
          }

          this.stream = stream;
          this.isConnected = true;
          this.lastActivity = new Date();

          // Configurar eventos del stream
          stream.on('data', (data: Buffer) => {
            this.lastActivity = new Date();
            this.emit('data', data.toString());
          });

          stream.on('close', () => {
            console.log('📱 SSH shell closed');
            this.isConnected = false;
            this.emit('close');
          });

          stream.stderr.on('data', (data: Buffer) => {
            this.lastActivity = new Date();
            this.emit('data', data.toString());
          });

          console.log(`🐚 SSH shell ready for ${connectionConfig.host}`);
          resolve();
        });
      });

      this.client.on('error', (err) => {
        console.error('❌ SSH client error:', err);
        this.emit('error', err);
        reject(err);
      });

      this.client.on('close', () => {
        console.log('📱 SSH client closed');
        this.isConnected = false;
        this.emit('close');
      });
    });
  }

  write(data: string): void {
    if (this.stream && this.isConnected) {
      this.stream.write(data);
      this.lastActivity = new Date();
    }
  }

  resize(cols: number, rows: number): void {
    if (this.stream && this.isConnected) {
      this.stream.setWindow(rows, cols);
      this.lastActivity = new Date();
    }
  }

  async close(): Promise<void> {
    if (this.stream) {
      this.stream.close();
    }
    if (this.client) {
      this.client.end();
    }
    this.isConnected = false;
    this.emit('close');
  }

  getLastActivity(): Date {
    return this.lastActivity;
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }
}

export class SSHTerminalManager {
  private sessions: Map<string, SSHTerminalSession> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Limpiar sesiones inactivas cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveSessions();
    }, 5 * 60 * 1000);
  }

  async createSession(
    userId: string,
    connectionId: string,
    terminalOptions: TerminalOptions
  ): Promise<SSHTerminalSession> {
    try {
      // Obtener configuración de conexión de la base de datos
      const db = getDB();
      const connection = await db.getConnection(userId, connectionId);
      
      if (!connection) {
        throw new Error('SSH connection not found');
      }

      // Crear cliente SSH
      const client = new Client();
      const sessionId = `ssh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Crear sesión
      const session = new SSHTerminalSession(sessionId, userId, connectionId, client);
      
      // Conectar
      await session.connect(connection, terminalOptions);
      
      // Guardar sesión
      this.sessions.set(sessionId, session);
      
      // Log de actividad
      await db.addActivityLog(
        userId,
        'SSH_CONNECT',
        `SSH terminal session started for ${connection.name}`,
        connectionId
      );

      console.log(`🔑 SSH session created: ${sessionId} for user ${userId}`);
      
      return session;
    } catch (error) {
      console.error('❌ Failed to create SSH session:', error);
      throw error;
    }
  }

  getSession(sessionId: string): SSHTerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      await session.close();
      this.sessions.delete(sessionId);
      
      // Log de actividad
      try {
        const db = getDB();
        await db.addActivityLog(
          session.userId,
          'SSH_DISCONNECT',
          `SSH terminal session ended`,
          session.connectionId
        );
      } catch (error) {
        console.error('Error logging session close:', error);
      }
      
      console.log(`🔒 SSH session closed: ${sessionId}`);
    }
  }

  async closeAllSessions(): Promise<void> {
    const promises = Array.from(this.sessions.keys()).map(sessionId => 
      this.closeSession(sessionId)
    );
    await Promise.all(promises);
    console.log('🔒 All SSH sessions closed');
  }

  private async cleanupInactiveSessions(): Promise<void> {
    const now = new Date();
    const maxInactiveTime = 30 * 60 * 1000; // 30 minutos

    for (const [sessionId, session] of this.sessions.entries()) {
      const timeSinceActivity = now.getTime() - session.getLastActivity().getTime();
      
      if (timeSinceActivity > maxInactiveTime || !session.getIsConnected()) {
        console.log(`🧹 Cleaning up inactive session: ${sessionId}`);
        await this.closeSession(sessionId);
      }
    }
  }

  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  getSessionsByUser(userId: string): SSHTerminalSession[] {
    return Array.from(this.sessions.values()).filter(
      session => session.userId === userId
    );
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.closeAllSessions();
  }
}