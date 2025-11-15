import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    // Obtener el refresh token desde las cookies
    const refreshToken = request.cookies.get('refresh-token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token provided' },
        { status: 401 }
      );
    }

    // Verificar el refresh token
    const payload = AuthService.verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Generar nuevo token de acceso
    const newToken = AuthService.generateToken({
      userId: payload.userId,
      username: payload.username,
      email: payload.email
    });

    // Generar nuevo refresh token (rotación de tokens)
    const newRefreshToken = AuthService.generateRefreshToken(payload.userId, payload.username, payload.email);

    // Crear cookies actualizadas
    const cookies = AuthService.createAuthCookies(newToken, newRefreshToken);

    const response = NextResponse.json({
      success: true,
      token: newToken
    });

    // Establecer nuevas cookies
    response.cookies.set(cookies.authToken);
    response.cookies.set(cookies.refreshToken);

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Token refresh failed' },
      { status: 401 }
    );
  }
}