import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/database/postgresql';
import { AuthService } from '@/lib/auth/jwt';

async function getUserFromCookies(request: NextRequest) {
  console.log('🔐 getUserFromCookies() STARTED');
  try {
    const authCookie = request.cookies.get('auth-token');
    
    if (!authCookie) {
      console.log('❌ No auth cookie found');
      return null;
    }

    console.log('🍪 Auth cookie found:', authCookie.value.substring(0, 50) + '...');
    
    const payload = AuthService.verifyToken(authCookie.value);
    console.log('✅ Token verified for user:', payload.username);
    return payload;
  } catch (error) {
    console.log('❌ Token verification failed:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  console.log('🚀 TEST ROUTE HANDLER STARTED - /api/test-connections/');
  console.log('📊 Request URL:', request.url);
  console.log('🍪 Request cookies:', request.cookies.toString());
  
  try {
    console.log('🔍 GET /api/test-connections/ - Starting request');
    
    const user = await getUserFromCookies(request);
    if (!user) {
      console.log('❌ Authentication failed, returning 401');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('📡 Loading connections for user:', user.username);
    
    const db = getDB();
    const connections = await db.getConnections(user.userId);
    
    console.log('📋 Found connections:', connections.length);
    
    // No devolver passwords/keys por seguridad
    const safeConnections = connections.map((conn: any) => {
      const { password, private_key, ...safe } = conn;
      return { 
        ...safe, 
        status: 'disconnected' as const,
        port: safe.port || 22,
        privateKey: undefined // Para compatibilidad con el frontend
      };
    });

    console.log('✅ Returning connections successfully');
    return NextResponse.json({ 
      message: 'TEST ROUTE SUCCESS!', 
      connections: safeConnections 
    });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}