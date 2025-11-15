import { NextRequest, NextResponse } from 'next/server';
import { getSSHManager } from '@/lib/ssh/manager';
import { getDB } from '@/lib/database/json-db';

interface Params {
  id: string;
}

export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const db = getDB();
    const connection = db.getDecryptedConnection(params.id);

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    const sshManager = getSSHManager();
    
    const sessionId = await sshManager.connect(params.id, {
      host: connection.host,
      port: connection.port,
      username: connection.username,
      password: connection.password,
      privateKey: connection.privateKey
    });

    // Actualizar última conexión
    db.updateConnection(params.id, {
      lastConnected: new Date()
    });

    return NextResponse.json({ 
      success: true,
      sessionId,
      message: `Connected to ${connection.name}`
    });
  } catch (error) {
    console.error('Connection error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}