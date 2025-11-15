import { NodeSSH } from 'node-ssh';
import { EventEmitter } from 'events';

interface SSHExecCommandResponse {
  stdout: string;
  stderr: string;
  code: number | null;
  signal: string | null;
}
import { getDB } from '@/lib/database/json-db';

export interface SSHConnectionConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
}

export interface SSHSessionInfo {
  id: string;
  connectionId: string;
  ssh: NodeSSH;
  isConnected: boolean;
  lastActivity: Date;
  currentDirectory: string;
}

export class SSHManager extends EventEmitter {
  private sessions: Map<string, SSHSessionInfo> = new Map();
  private db = getDB();

  constructor() {
    super();
    this.setupCleanupInterval();
  }

  async connect(connectionId: string, config: SSHConnectionConfig): Promise<string> {
    try {
      const ssh = new NodeSSH();
      
      // Configurar conexión SSH
      const connectionConfig: any = {
        host: config.host,
        port: config.port,
        username: config.username,
        readyTimeout: 20000,
        algorithms: {
          kex: ['diffie-hellman-group14-sha256', 'diffie-hellman-group16-sha512'],
          cipher: ['aes128-ctr', 'aes192-ctr', 'aes256-ctr'],
          serverHostKey: ['rsa-sha2-512', 'rsa-sha2-256', 'ssh-rsa'],
          hmac: ['hmac-sha2-256', 'hmac-sha2-512']
        }
      };

      if (config.password) {
        connectionConfig.password = config.password;
      } else if (config.privateKey) {
        connectionConfig.privateKey = config.privateKey;
        if (config.passphrase) {
          connectionConfig.passphrase = config.passphrase;
        }
      }

      await ssh.connect(connectionConfig);

      // Crear sesión
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const session: SSHSessionInfo = {
        id: sessionId,
        connectionId,
        ssh,
        isConnected: true,
        lastActivity: new Date(),
        currentDirectory: '~'
      };

      this.sessions.set(sessionId, session);

      // Obtener directorio inicial
      try {
        const pwdResult = await ssh.execCommand('pwd');
        if (pwdResult.stdout) {
          session.currentDirectory = pwdResult.stdout.trim();
        }
      } catch (error) {
        console.warn('Could not get initial directory:', error);
      }

      // Log de actividad
      this.db.addActivityLog(connectionId, 'CONNECTED', `Connected to ${config.host}:${config.port}`);

      this.emit('connected', { sessionId, connectionId });
      
      return sessionId;
    } catch (error) {
      this.db.addActivityLog(connectionId, 'CONNECTION_FAILED', `Failed to connect: ${error}`);
      this.emit('connectionFailed', { connectionId, error });
      throw error;
    }
  }

  async disconnect(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    try {
      await session.ssh.dispose();
      session.isConnected = false;
      this.sessions.delete(sessionId);

      this.db.addActivityLog(session.connectionId, 'DISCONNECTED', 'Session disconnected');
      this.emit('disconnected', { sessionId, connectionId: session.connectionId });
    } catch (error) {
      console.error('Error disconnecting SSH session:', error);
      throw error;
    }
  }

  async executeCommand(sessionId: string, command: string, cwd?: string): Promise<SSHExecCommandResponse> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isConnected) {
      throw new Error('Session not found or not connected');
    }

    try {
      session.lastActivity = new Date();
      
      // Usar directorio actual si no se especifica uno
      const execCwd = cwd || session.currentDirectory;
      
      const result = await session.ssh.execCommand(command, {
        cwd: execCwd,
        execOptions: { pty: true }
      });

      // Actualizar directorio actual si el comando lo cambió
      if (command.trim().startsWith('cd ')) {
        try {
          const pwdResult = await session.ssh.execCommand('pwd', { cwd: execCwd });
          if (pwdResult.stdout) {
            session.currentDirectory = pwdResult.stdout.trim();
          }
        } catch (error) {
          console.warn('Could not update current directory:', error);
        }
      }

      // Log del comando
      this.db.addActivityLog(
        session.connectionId, 
        'COMMAND_EXECUTED', 
        JSON.stringify({ command, cwd: execCwd, exitCode: result.code })
      );

      this.emit('commandExecuted', {
        sessionId,
        connectionId: session.connectionId,
        command,
        result
      });

      return result;
    } catch (error) {
      this.db.addActivityLog(
        session.connectionId,
        'COMMAND_FAILED',
        JSON.stringify({ command, error: String(error) })
      );
      throw error;
    }
  }

  getSession(sessionId: string): SSHSessionInfo | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): SSHSessionInfo[] {
    return Array.from(this.sessions.values());
  }

  getSessionsByConnection(connectionId: string): SSHSessionInfo[] {
    return Array.from(this.sessions.values()).filter(
      session => session.connectionId === connectionId
    );
  }

  async testConnection(config: SSHConnectionConfig): Promise<{ success: boolean; error?: string; latency?: number }> {
    const startTime = Date.now();
    const ssh = new NodeSSH();

    try {
      const connectionConfig: any = {
        host: config.host,
        port: config.port,
        username: config.username,
        readyTimeout: 10000
      };

      if (config.password) {
        connectionConfig.password = config.password;
      } else if (config.privateKey) {
        connectionConfig.privateKey = config.privateKey;
        if (config.passphrase) {
          connectionConfig.passphrase = config.passphrase;
        }
      }

      await ssh.connect(connectionConfig);
      
      // Test básico con whoami
      const result = await ssh.execCommand('whoami');
      await ssh.dispose();

      const latency = Date.now() - startTime;
      
      return {
        success: true,
        latency
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private setupCleanupInterval() {
    // Limpiar sesiones inactivas cada 5 minutos
    setInterval(() => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      for (const [sessionId, session] of this.sessions.entries()) {
        if (session.lastActivity < fiveMinutesAgo && !session.isConnected) {
          this.sessions.delete(sessionId);
          console.log(`Cleaned up inactive session: ${sessionId}`);
        }
      }
    }, 5 * 60 * 1000);
  }

  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.sessions.keys()).map(sessionId => 
      this.disconnect(sessionId).catch(console.error)
    );
    await Promise.all(promises);
  }
}

// Singleton instance
let sshManagerInstance: SSHManager | null = null;

export function getSSHManager(): SSHManager {
  if (!sshManagerInstance) {
    sshManagerInstance = new SSHManager();
  }
  return sshManagerInstance;
}