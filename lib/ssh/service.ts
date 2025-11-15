import { SSHConnection } from '@/components/ssh-manager';

export interface APIResponse<T = any> {
  success?: boolean;
  error?: string;
  details?: string;
  data?: T;
}

export interface ConnectionResponse {
  connection: SSHConnection;
}

export interface ConnectionsResponse {
  connections: SSHConnection[];
}

export interface ConnectResponse {
  success: boolean;
  sessionId: string;
  message: string;
}

export interface TestConnectionResponse {
  success: boolean;
  error?: string;
  latency?: number;
}

export interface ExecuteCommandResponse {
  success: boolean;
  output?: string;
  error?: string;
  exitCode?: number;
  command: string;
  timestamp: string;
}

class SSHService {
  private baseUrl = '/api/ssh';

  // Gestión de conexiones
  async getAllConnections(): Promise<SSHConnection[]> {
    try {
      const response = await fetch(`${this.baseUrl}/connections`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch connections');
      }
      
      return data.connections;
    } catch (error) {
      console.error('Error fetching connections:', error);
      throw error;
    }
  }

  async getConnection(id: string): Promise<SSHConnection> {
    try {
      const response = await fetch(`${this.baseUrl}/connections/${id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch connection');
      }
      
      return data.connection;
    } catch (error) {
      console.error('Error fetching connection:', error);
      throw error;
    }
  }

  async createConnection(connection: Omit<SSHConnection, 'id' | 'status' | 'lastConnected'>): Promise<SSHConnection> {
    try {
      const response = await fetch(`${this.baseUrl}/connections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connection),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create connection');
      }
      
      return data.connection;
    } catch (error) {
      console.error('Error creating connection:', error);
      throw error;
    }
  }

  async updateConnection(id: string, updates: Partial<SSHConnection>): Promise<SSHConnection> {
    try {
      const response = await fetch(`${this.baseUrl}/connections/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update connection');
      }
      
      return data.connection;
    } catch (error) {
      console.error('Error updating connection:', error);
      throw error;
    }
  }

  async deleteConnection(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/connections/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete connection');
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
      throw error;
    }
  }

  // Conexiones SSH
  async connect(connectionId: string): Promise<ConnectResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/connections/${connectionId}/connect`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to connect');
      }
      
      return data;
    } catch (error) {
      console.error('Error connecting:', error);
      throw error;
    }
  }

  async disconnect(sessionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to disconnect');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      throw error;
    }
  }

  async testConnection(config: {
    host: string;
    port: number;
    username: string;
    password?: string;
    privateKey?: string;
  }): Promise<TestConnectionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error testing connection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Terminal
  async executeCommand(sessionId: string, command: string, cwd?: string): Promise<ExecuteCommandResponse> {
    try {
      const response = await fetch('/api/terminal/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, command, cwd }),
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error executing command:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        command,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Singleton instance
export const sshService = new SSHService();