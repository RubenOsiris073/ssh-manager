import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/database/json-db';

export async function GET() {
  try {
    const db = getDB();
    const connections = db.getAllConnections();
    
    // No devolver passwords/keys por seguridad
    const safeConnections = connections.map(conn => {
      const { password, privateKey, ...safe } = conn;
      return { ...safe, status: 'disconnected' as const };
    });

    return NextResponse.json({ connections: safeConnections });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, host, port = 22, username, password, privateKey, groupId, notes } = body;

    if (!name || !host || !username) {
      return NextResponse.json(
        { error: 'Name, host, and username are required' },
        { status: 400 }
      );
    }

    const db = getDB();
    const connection = db.createConnection({
      name,
      host,
      port: Number(port),
      username,
      password,
      privateKey,
      groupId,
      notes,
      lastConnected: undefined
    });

    // No devolver password/key
    const { password: _, privateKey: __, ...safeConnection } = connection;
    
    return NextResponse.json({ 
      connection: { ...safeConnection, status: 'disconnected' as const }
    });
  } catch (error) {
    console.error('Error creating connection:', error);
    return NextResponse.json(
      { error: 'Failed to create connection' },
      { status: 500 }
    );
  }
}