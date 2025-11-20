import { NextRequest, NextResponse } from 'next/server';
import { getSSHManager } from '@/lib/ssh/manager';
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
    console.log('❌ Token verification failed:', error);
    return null;
  }
}

export async function POST(request: NextRequest, { params }: { params: Params }) {
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

    // Para el demo, vamos a simplificar y devolver éxito sin hacer la conexión SSH real
    // En su lugar, el WebSocket manejará la conexión real
    return NextResponse.json({ 
      success: true,
      sessionId: `temp_${Date.now()}`,
      message: `Ready to connect to ${connection.name}`
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