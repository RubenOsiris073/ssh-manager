-- SSH Manager Database Schema
-- This script initializes the PostgreSQL database with all required tables

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user'))
);

-- Create connections table
CREATE TABLE IF NOT EXISTS connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    hostname VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL DEFAULT 22 CHECK (port > 0 AND port <= 65535),
    username VARCHAR(255) NOT NULL,
    encrypted_password TEXT,
    encrypted_private_key TEXT,
    private_key_passphrase_encrypted TEXT,
    connection_type VARCHAR(20) DEFAULT 'password' CHECK (connection_type IN ('password', 'key', 'key_passphrase')),
    group_name VARCHAR(100) DEFAULT 'default',
    description TEXT,
    tags TEXT[],
    last_connected TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    connection_timeout INTEGER DEFAULT 30000,
    keep_alive_interval INTEGER DEFAULT 0,
    UNIQUE(user_id, name)
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    connection_id UUID REFERENCES connections(id) ON DELETE SET NULL,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(255),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Create sessions table for SSH session management
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    terminal_size JSONB DEFAULT '{"cols": 80, "rows": 24}',
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_hostname ON connections(hostname);
CREATE INDEX IF NOT EXISTS idx_connections_group ON connections(group_name);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_connection_id ON activity_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_connection_id ON sessions(connection_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_connections_updated_at ON connections;
CREATE TRIGGER update_connections_updated_at 
    BEFORE UPDATE ON connections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, role) 
VALUES (
    'admin', 
    'admin@sshmanager.local', 
    '$2b$10$8K1p/a0dUzsAkm.9WusKX.4qOun7nvCOjXdUwn0GZqjtmhMIv.9yW',  -- admin123
    'admin'
) ON CONFLICT (username) DO NOTHING;

-- Create some sample connections for the admin user
INSERT INTO connections (user_id, name, hostname, port, username, connection_type, group_name, description)
SELECT 
    u.id,
    'Local Server',
    'localhost',
    22,
    'root',
    'password',
    'local',
    'Local development server'
FROM users u WHERE u.username = 'admin'
ON CONFLICT (user_id, name) DO NOTHING;

-- Log the initialization
INSERT INTO activity_logs (user_id, activity_type, description, ip_address)
SELECT 
    u.id,
    'SYSTEM_INIT',
    'Database initialized with sample data',
    '127.0.0.1'::inet
FROM users u WHERE u.username = 'admin'
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sshmanager;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sshmanager;

ANALYZE;