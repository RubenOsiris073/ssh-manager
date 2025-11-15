import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/database/json-db';

interface Params {
  id: string;
}

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const db = getDB();
    const connection = db.getConnection(params.id);

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // No devolver password/key por seguridad
    const { password, privateKey, ...safeConnection } = connection;
    return NextResponse.json({ 
      connection: { ...safeConnection, status: 'disconnected' as const }
    });
  } catch (error) {
    console.error('Error fetching connection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connection' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const body = await request.json();
    const { name, host, port, username, password, privateKey, groupId, notes } = body;

    const db = getDB();
    const updatedConnection = db.updateConnection(params.id, {
      name,
      host,
      port: port ? Number(port) : undefined,
      username,
      password,
      privateKey,
      groupId,
      notes
    });

    if (!updatedConnection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // No devolver password/key
    const { password: _, privateKey: __, ...safeConnection } = updatedConnection;
    return NextResponse.json({ 
      connection: { ...safeConnection, status: 'disconnected' as const }
    });
  } catch (error) {
    console.error('Error updating connection:', error);
    return NextResponse.json(
      { error: 'Failed to update connection' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const db = getDB();
    const success = db.deleteConnection(params.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting connection:', error);
    return NextResponse.json(
      { error: 'Failed to delete connection' },
      { status: 500 }
    );
  }
}