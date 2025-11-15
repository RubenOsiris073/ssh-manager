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
  private dataFile = './ssh-manager-data.json';
  private data: DatabaseData;

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      if (typeof window !== 'undefined') {
        // Cliente - usar localStorage
        const stored = localStorage.getItem('ssh-manager-data');
        this.data = stored ? JSON.parse(stored) : this.getDefaultData();
      } else {
        // Servidor - usar archivo JSON (simulado por ahora)
        this.data = this.getDefaultData();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.data = this.getDefaultData();
    }
  }

  private getDefaultData(): DatabaseData {
    return {
      connections: [],
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
  }

  private saveData() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('ssh-manager-data', JSON.stringify(this.data));
      }
      // En el servidor simplemente mantenemos en memoria por ahora
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  // Métodos para conexiones
  getAllConnections(): DBConnection[] {
    const stmt = this.db.prepare('SELECT * FROM connections ORDER BY updatedAt DESC');
    return stmt.all() as DBConnection[];
  }

  getConnection(id: string): DBConnection | null {
    const stmt = this.db.prepare('SELECT * FROM connections WHERE id = ?');
    return stmt.get(id) as DBConnection | null;
  }

  createConnection(connection: Omit<DBConnection, 'id' | 'createdAt' | 'updatedAt'>): DBConnection {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO connections (id, name, host, port, username, password, privateKey, groupId, notes, lastConnected, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      connection.name,
      connection.host,
      connection.port,
      connection.username,
      connection.password ? this.encrypt(connection.password) : null,
      connection.privateKey ? this.encrypt(connection.privateKey) : null,
      connection.groupId,
      connection.notes,
      connection.lastConnected,
      now,
      now
    );

    return this.getConnection(id)!;
  }

  updateConnection(id: string, updates: Partial<DBConnection>): DBConnection | null {
    const now = new Date().toISOString();
    const fields = Object.keys(updates).filter(key => key !== 'id').join(', ');
    const placeholders = Object.keys(updates).filter(key => key !== 'id').map(() => '?').join(', ');
    
    if (updates.password) {
      updates.password = this.encrypt(updates.password);
    }
    if (updates.privateKey) {
      updates.privateKey = this.encrypt(updates.privateKey);
    }

    const stmt = this.db.prepare(`
      UPDATE connections 
      SET ${Object.keys(updates).filter(key => key !== 'id').map(key => `${key} = ?`).join(', ')}, updatedAt = ?
      WHERE id = ?
    `);

    const values = Object.values(updates).filter((_, index) => Object.keys(updates)[index] !== 'id');
    stmt.run(...values, now, id);

    return this.getConnection(id);
  }

  deleteConnection(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM connections WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Métodos de encriptación básica (mejorar en producción)
  private encrypt(text: string): string {
    const algorithm = 'aes-256-gcm';
    const secret = process.env.ENCRYPTION_SECRET || 'default-secret-key-change-in-production';
    const key = crypto.scryptSync(secret, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string): string {
    const algorithm = 'aes-256-gcm';
    const secret = process.env.ENCRYPTION_SECRET || 'default-secret-key-change-in-production';
    const key = crypto.scryptSync(secret, 'salt', 32);
    
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
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
    const stmt = this.db.prepare(`
      INSERT INTO activity_logs (id, connectionId, action, details, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      crypto.randomUUID(),
      connectionId,
      action,
      details,
      new Date().toISOString()
    );
  }

  getActivityLogs(connectionId?: string, limit: number = 100) {
    let query = 'SELECT * FROM activity_logs';
    let params: any[] = [];

    if (connectionId) {
      query += ' WHERE connectionId = ?';
      params.push(connectionId);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  close() {
    this.db.close();
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