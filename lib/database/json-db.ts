import { SSHConnection } from '@/components/ssh-manager';

export interface DBConnection extends Omit<SSHConnection, 'status'> {
  password?: string;
  privateKey?: string;
  createdAt: string;
  updatedAt: string;
}

interface DatabaseData {
  connections: DBConnection[];
  groups: any[];
  logs: any[];
}

class DatabaseManager {
  private data: DatabaseData = {
    connections: [],
    groups: [],
    logs: []
  };

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      // En el servidor, usar datos por defecto por ahora
      this.data = {
        connections: [
          {
            id: "1",
            name: "Production Server",
            host: "192.168.1.100",
            port: 22,
            username: "root",
            lastConnected: new Date(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: "2",
            name: "Development Server", 
            host: "dev.example.com",
            port: 2222,
            username: "developer",
            lastConnected: new Date(Date.now() - 86400000),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        groups: [
          {
            id: "1",
            name: "Production",
            color: "bg-red-500/20 text-red-400 border-red-500/30",
            isExpanded: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: "2", 
            name: "Development",
            color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
            isExpanded: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        logs: []
      };
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  private saveData() {
    // Por ahora solo guardamos en memoria
    // En una implementación real guardaríamos en archivo o BD
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 5);
  }

  // Métodos para conexiones
  getAllConnections(): DBConnection[] {
    return this.data.connections;
  }

  getConnection(id: string): DBConnection | null {
    return this.data.connections.find(conn => conn.id === id) || null;
  }

  createConnection(connection: Omit<DBConnection, 'id' | 'createdAt' | 'updatedAt'>): DBConnection {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const newConnection: DBConnection = {
      ...connection,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.data.connections.push(newConnection);
    this.saveData();

    return newConnection;
  }

  updateConnection(id: string, updates: Partial<DBConnection>): DBConnection | null {
    const index = this.data.connections.findIndex(conn => conn.id === id);
    
    if (index === -1) {
      return null;
    }

    const now = new Date().toISOString();
    this.data.connections[index] = {
      ...this.data.connections[index],
      ...updates,
      updatedAt: now
    };

    this.saveData();
    return this.data.connections[index];
  }

  deleteConnection(id: string): boolean {
    const initialLength = this.data.connections.length;
    this.data.connections = this.data.connections.filter(conn => conn.id !== id);
    
    if (this.data.connections.length < initialLength) {
      this.saveData();
      return true;
    }
    return false;
  }

  // Métodos de encriptación básica (simulados por ahora)
  private encrypt(text: string): string {
    // En una implementación real usarías crypto apropiadamente
    try {
      return btoa(text);
    } catch {
      return text;
    }
  }

  private decrypt(encryptedText: string): string {
    // En una implementación real usarías crypto apropiadamente
    try {
      return atob(encryptedText);
    } catch {
      return encryptedText; // Si falla, devolver el texto original
    }
  }

  getDecryptedConnection(id: string): DBConnection | null {
    const connection = this.getConnection(id);
    if (!connection) return null;

    if (connection.password) {
      connection.password = this.decrypt(connection.password);
    }
    if (connection.privateKey) {
      connection.privateKey = this.decrypt(connection.privateKey);
    }

    return connection;
  }

  // Logs de actividad
  addActivityLog(connectionId: string, action: string, details?: string) {
    const log = {
      id: this.generateId(),
      connectionId,
      action,
      details,
      timestamp: new Date().toISOString()
    };

    this.data.logs.push(log);
    this.saveData();
  }

  getActivityLogs(connectionId?: string, limit: number = 100) {
    let logs = this.data.logs;

    if (connectionId) {
      logs = logs.filter(log => log.connectionId === connectionId);
    }

    return logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  close() {
    // Cleanup if needed
  }
}

// Singleton instance
let dbInstance: DatabaseManager | null = null;

export function getDB(): DatabaseManager {
  if (!dbInstance) {
    dbInstance = new DatabaseManager();
  }
  return dbInstance;
}