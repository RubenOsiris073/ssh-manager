import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/jwt';
import { getDB } from '@/lib/database/postgresql';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Auth me check - All cookies:', request.cookies.getAll());
    
    // Extraer token desde cookies o header
    const token = AuthService.extractTokenFromRequest(request);
    
    if (!token) {
      console.log('❌ No token found in request');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('🍪 Found token:', token.substring(0, 50) + '...');

    // Verificar token
    const payload = AuthService.verifyToken(token);
    console.log('✅ Token verified for user:', payload.userId);
    
    // Obtener información actualizada del usuario desde la base de datos
    const db = getDB();
    const user = await db.getUserById(payload.userId);
    
    if (!user) {
      console.log('❌ User not found in database:', payload.userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ User found:', user.username);
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });
  } catch (error) {
    console.error('❌ Auth verification error:', error);
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}