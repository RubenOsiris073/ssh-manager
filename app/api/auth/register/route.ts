import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/database/postgresql';
import { AuthService } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json();

    // Validaciones básicas
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const db = getDB();

    // Verificar si el usuario ya existe
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Crear usuario
    const user = await db.createUser(username, email, password);

    // Generar tokens
    const token = AuthService.generateToken({
      userId: user.id,
      username: user.username,
      email: user.email
    });

    const refreshToken = AuthService.generateRefreshToken(user.id);

    // Log de actividad
    await db.addActivityLog(
      user.id,
      'USER_REGISTERED',
      `User ${username} registered successfully`,
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
        createdAt: user.created_at
      },
      token
    });

    // Establecer cookies
    response.cookies.set(cookies.authToken);
    response.cookies.set(cookies.refreshToken);

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}