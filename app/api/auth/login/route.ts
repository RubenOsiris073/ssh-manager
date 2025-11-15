import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/database/postgresql';
import { AuthService } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const db = getDB();

    // Buscar usuario
    const user = await db.getUserByUsername(username);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const isValidPassword = await db.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      // Log del intento de login fallido
      await db.addActivityLog(
        user.id,
        'LOGIN_FAILED',
        'Invalid password attempt',
        undefined,
        request.ip,
        request.headers.get('user-agent')
      );

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generar tokens
    const token = AuthService.generateToken({
      userId: user.id,
      username: user.username,
      email: user.email
    });

    const refreshToken = AuthService.generateRefreshToken(user.id, user.username, user.email);

    // Log del login exitoso
    await db.addActivityLog(
      user.id,
      'USER_LOGIN',
      `User ${username} logged in successfully`,
      undefined,
      request.ip,
      request.headers.get('user-agent')
    );

    // Crear cookies de autenticación
    const cookies = AuthService.createAuthCookies(token, refreshToken);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at,
        lastLogin: new Date()
      },
      token
    });

    // Establecer cookies
    response.cookies.set(cookies.authToken);
    response.cookies.set(cookies.refreshToken);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}