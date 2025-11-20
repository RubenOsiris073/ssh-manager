import { Pool, PoolClient } from 'pg';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface SSHConnection {
  id: string;
  user_id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string; // encrypted
  private_key?: string; // encrypted
  group_id?: string;
  notes?: string;
  last_connected?: Date;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface ConnectionGroup {
  id: string;
  user_id: string;
  name: string;
  color: string;
  is_expanded: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  connection_id?: string;
  activity_type: string;
  description?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
  success?: boolean;
  error_message?: string;
}

class DatabaseManager {
  private pool: Pool;
  private encryptionKey: Buffer;

  constructor() {
    // Configuración de conexión PostgreSQL
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://sshmanager:sshmanager123@localhost:5432/sshmanager',
      ssl: false, // Deshabilitado para el contenedor Docker
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Clave de encriptación para credenciales SSH
    const secret = process.env.ENCRYPTION_SECRET || 'default-secret-key-change-in-production';
    this.encryptionKey = crypto.scryptSync(secret, 'salt', 32);
    
    this.initDatabase();
  }

  private async initDatabase() {
    const client = await this.pool.connect();
    try {
      // Crear tablas si no existen
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          is_active BOOLEAN DEFAULT true
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS connection_groups (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(100) NOT NULL,
          color VARCHAR(50) DEFAULT 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          is_expanded BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS ssh_connections (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(100) NOT NULL,
          host VARCHAR(255) NOT NULL,
          port INTEGER DEFAULT 22,
          username VARCHAR(100) NOT NULL,
          password TEXT, -- encrypted
          private_key TEXT, -- encrypted
          group_id UUID REFERENCES connection_groups(id) ON DELETE SET NULL,
          notes TEXT,
          last_connected TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          is_active BOOLEAN DEFAULT true
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS activity_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          connection_id UUID REFERENCES ssh_connections(id) ON DELETE SET NULL,
          action VARCHAR(50) NOT NULL,
          details TEXT,
          ip_address INET,
          user_agent TEXT,
          timestamp TIMESTAMP DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS ssh_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          connection_id UUID REFERENCES ssh_connections(id) ON DELETE CASCADE,
          session_token VARCHAR(255) UNIQUE NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          last_activity TIMESTAMP DEFAULT NOW()
        );
      `);

      // Índices para rendimiento
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_ssh_connections_user_id ON ssh_connections(user_id);
        CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
        CREATE INDEX IF NOT EXISTS idx_ssh_sessions_user_id ON ssh_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_ssh_sessions_active ON ssh_sessions(is_active);
      `);

      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Métodos de encriptación
  private encrypt(text: string): string {
    if (!text) return '';
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedText: string): string {
    if (!encryptedText) return '';
    
    // Si no contiene ':', probablemente es texto plano (datos de prueba)
    if (!encryptedText.includes(':')) {
      console.log('🔓 Returning plain text password');
      return encryptedText;
    }
    
    try {
      const [ivHex, encrypted] = encryptedText.split(':');
      
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.warn('⚠️ Failed to decrypt, returning as plain text:', error);
      return encryptedText;
    }
  }

  // Métodos de usuarios
  async createUser(username: string, email: string, password: string): Promise<User> {
    const client = await this.pool.connect();
    try {
      const passwordHash = await bcrypt.hash(password, 12);
      
      const result = await client.query(`
        INSERT INTO users (username, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [username, email, passwordHash]);

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM users WHERE username = $1 AND is_active = true
      `, [username]);

      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM users WHERE id = $1 AND is_active = true
      `, [userId]);

      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Métodos de conexiones SSH
  async getConnections(userId: string): Promise<SSHConnection[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, user_id, name, host, port, username, group_id, notes, 
               last_connected, created_at, updated_at, is_active
        FROM ssh_connections 
        WHERE user_id = $1 AND is_active = true
        ORDER BY updated_at DESC
      `, [userId]);

      return result.rows;
    } finally {
      client.release();
    }
  }

  async getConnection(userId: string, connectionId: string): Promise<SSHConnection | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM ssh_connections 
        WHERE id = $1 AND user_id = $2 AND is_active = true
      `, [connectionId, userId]);

      const connection = result.rows[0];
      if (!connection) return null;

      // Desencriptar credenciales
      if (connection.password) {
        console.log('🔐 Processing password for connection:', connection.name);
        connection.password = this.decrypt(connection.password);
      }
      if (connection.private_key) {
        connection.private_key = this.decrypt(connection.private_key);
      }

      return connection;
    } finally {
      client.release();
    }
  }

  async createConnection(userId: string, connectionData: Omit<SSHConnection, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_active'>): Promise<SSHConnection> {
    const client = await this.pool.connect();
    try {
      // Encriptar credenciales
      const encryptedPassword = connectionData.password ? this.encrypt(connectionData.password) : null;
      const encryptedPrivateKey = connectionData.private_key ? this.encrypt(connectionData.private_key) : null;

      const result = await client.query(`
        INSERT INTO ssh_connections (
          user_id, name, host, port, username, password, private_key, 
          group_id, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, user_id, name, host, port, username, group_id, 
                  notes, last_connected, created_at, updated_at, is_active
      `, [
        userId, connectionData.name, connectionData.host, connectionData.port,
        connectionData.username, encryptedPassword, encryptedPrivateKey,
        connectionData.group_id, connectionData.notes
      ]);

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async updateConnection(userId: string, connectionId: string, updates: Partial<SSHConnection>): Promise<SSHConnection | null> {
    const client = await this.pool.connect();
    try {
      // Preparar campos para actualizar
      const fields = [];
      const values = [];
      let paramIndex = 1;

      if (updates.name !== undefined) {
        fields.push(`name = $${paramIndex++}`);
        values.push(updates.name);
      }
      if (updates.host !== undefined) {
        fields.push(`host = $${paramIndex++}`);
        values.push(updates.host);
      }
      if (updates.port !== undefined) {
        fields.push(`port = $${paramIndex++}`);
        values.push(updates.port);
      }
      if (updates.username !== undefined) {
        fields.push(`username = $${paramIndex++}`);
        values.push(updates.username);
      }
      if (updates.password !== undefined) {
        fields.push(`password = $${paramIndex++}`);
        values.push(updates.password ? this.encrypt(updates.password) : null);
      }
      if (updates.private_key !== undefined) {
        fields.push(`private_key = $${paramIndex++}`);
        values.push(updates.private_key ? this.encrypt(updates.private_key) : null);
      }
      if (updates.group_id !== undefined) {
        fields.push(`group_id = $${paramIndex++}`);
        values.push(updates.group_id);
      }
      if (updates.notes !== undefined) {
        fields.push(`notes = $${paramIndex++}`);
        values.push(updates.notes);
      }
      if (updates.last_connected !== undefined) {
        fields.push(`last_connected = $${paramIndex++}`);
        values.push(updates.last_connected);
      }

      fields.push(`updated_at = NOW()`);
      values.push(connectionId, userId);

      const result = await client.query(`
        UPDATE ssh_connections 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} AND is_active = true
        RETURNING id, user_id, name, host, port, username, group_id,
                  notes, last_connected, created_at, updated_at, is_active
      `, values);

      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async deleteConnection(userId: string, connectionId: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        UPDATE ssh_connections 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1 AND user_id = $2 AND is_active = true
      `, [connectionId, userId]);

      return (result.rowCount ?? 0) > 0;
    } finally {
      client.release();
    }
  }

  // Logs de actividad
  async addActivityLog(userId: string, action: string, details?: string, connectionId?: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO activity_logs (user_id, connection_id, activity_type, description, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [userId, connectionId, action, details, ipAddress, userAgent]);
    } finally {
      client.release();
    }
  }

  async getActivityLogs(userId: string, limit: number = 100, connectionId?: string): Promise<ActivityLog[]> {
    const client = await this.pool.connect();
    try {
      const query = connectionId
        ? `SELECT * FROM activity_logs WHERE user_id = $1 AND connection_id = $2 ORDER BY created_at DESC LIMIT $3`
        : `SELECT * FROM activity_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`;
      
      const params = connectionId ? [userId, connectionId, limit] : [userId, limit];
      const result = await client.query(query, params);

      return result.rows;
    } finally {
      client.release();
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
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