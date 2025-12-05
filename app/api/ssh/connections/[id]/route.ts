import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/database/postgresql';
import { AuthService } from '@/lib/auth/jwt';

interface Params {
  id: string;
}

async function getUserFromCookies(request: NextRequest) {
  try {
    const authCookie = request.cookies.get('auth-token');
    
    if (!authCookie) {
      return null;
    }
    
    const payload = AuthService.verifyToken(authCookie.value);
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const user = await getUserFromCookies(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const db = getDB();
    const connection = await db.getConnection(user.userId, params.id);

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // No devolver password/key por seguridad
    const { password, private_key, ...safeConnection } = connection;
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
    const user = await getUserFromCookies(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, host, port, username, password, privateKey, groupId, notes } = body;

    const db = getDB();
    const updatedConnection = await db.updateConnection(user.userId, params.id, {
      name,
      host,
      port: port ? Number(port) : 22,
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
    const { password: _, private_key: __, ...safeConnection } = updatedConnection;
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
    console.log('🗑️ DELETE request for connection:', params.id);
    
    const user = await getUserFromCookies(request);
    if (!user) {
      console.log('❌ No authentication found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.username, 'userId:', user.userId);

    const db = getDB();
    const success = await db.deleteConnection(user.userId, params.id);

    console.log('🔍 Delete operation result:', success);

    if (!success) {
      console.log('❌ Connection not found or already deleted');
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    console.log('✅ Connection deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting connection:', error);
    return NextResponse.json(
      { error: 'Failed to delete connection' },
      { status: 500 }
    );
  }
}