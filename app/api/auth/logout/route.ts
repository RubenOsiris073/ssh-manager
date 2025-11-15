import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/database/postgresql';
import { AuthService } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    // Obtener el user ID desde el token
    const authorization = request.headers.get('authorization');
    const token = authorization?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const payload = AuthService.verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const db = getDB();

    // Log del logout
    await db.addActivityLog(
      payload.userId,
      'USER_LOGOUT',
      `User logged out`,
      undefined,
      request.ip,
      request.headers.get('user-agent')
    );

    // Crear respuesta que elimine las cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Eliminar cookies de autenticación
    response.cookies.set('auth-token', '', {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    response.cookies.set('refresh-token', '', {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}