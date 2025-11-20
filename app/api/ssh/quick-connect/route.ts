import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/jwt';
import { getDB } from '@/lib/database/postgresql';

async function getUserFromCookies(request: NextRequest) {
  try {
    console.log('🔍 All cookies:', request.cookies.getAll());
    const authCookie = request.cookies.get('auth-token');
    
    if (!authCookie) {
      console.log('❌ No auth-token cookie found');
      return null;
    }

    console.log('🍪 Found auth cookie:', authCookie.value.substring(0, 50) + '...');
    const payload = AuthService.verifyToken(authCookie.value);
    console.log('✅ Token verified for user:', payload.userId);
    return payload;
  } catch (error) {
    console.log('❌ Token verification failed:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromCookies(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { host: rawHost, port = 22, username: rawUsername, password, name } = body;

    // Trim whitespace from input fields
    const host = rawHost?.trim();
    const username = rawUsername?.trim();

    if (!host || !username || !password) {
      return NextResponse.json(
        { error: 'Host, username, and password are required' },
        { status: 400 }
      );
    }

    console.log('🚀 Quick Connect attempt:', { host, port, username, name: `${username}@${host}` });

    // Crear una conexión temporal primero
    const db = getDB();
    const connectionName = name?.trim() || `${username}@${host}`;
    
    const connection = await db.createConnection(user.userId, {
      name: connectionName,
      host,
      port: Number(port),
      username,
      password,
      private_key: undefined,
      group_id: undefined,
      notes: 'Quick Connect',
      last_connected: undefined
    });

    console.log('✅ Connection created:', connection.id);

    // Intentar conectar inmediatamente
    try {
      // Simular conexión exitosa (el WebSocket manejará la conexión real)
      return NextResponse.json({ 
        success: true,
        connectionId: connection.id,
        sessionId: `quick_${Date.now()}`,
        message: `Quick connect to ${connectionName} ready`
      });
    } catch (connectError) {
      console.error('❌ Quick connect failed:', connectError);
      
      // Si falla la conexión, eliminar la conexión temporal
      await db.deleteConnection(user.userId, connection.id);
      
      return NextResponse.json(
        { error: `Connection failed: ${connectError instanceof Error ? connectError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in quick connect:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}