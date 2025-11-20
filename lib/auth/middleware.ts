import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/jwt';

export function createAuthMiddleware() {
  return async function authMiddleware(request: NextRequest) {
    try {
      // Verificar si es una ruta protegida
      const pathname = request.nextUrl.pathname;
      
      // Rutas que requieren autenticación
      const protectedPaths = [
        '/api/ssh',
        '/api/connections',
        '/api/terminal'
      ];

      // Rutas de autenticación que no necesitan token
      const authPaths = [
        '/api/auth/login',
        '/api/auth/register'
      ];

      // Rutas que requieren autenticación pero procesamos internamente
      const authCheckPaths = [
        '/api/auth/me'
      ];

      const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
      const isAuthPath = authPaths.some(path => pathname.startsWith(path));
      const isAuthCheckPath = authCheckPaths.some(path => pathname.startsWith(path));

      // Si es una ruta de autenticación, permitir sin token
      if (isAuthPath) {
        return NextResponse.next();
      }

      // Si es una ruta de verificación de auth, permitir que pase y se maneje internamente
      if (isAuthCheckPath) {
        return NextResponse.next();
      }

      // Si es una ruta protegida, verificar autenticación
      if (isProtectedPath) {
        const token = AuthService.extractTokenFromRequest(request);
        
        console.log('🔍 Debug middleware:', {
          pathname,
          token: token ? 'TOKEN_EXISTS' : 'NO_TOKEN',
          cookies: request.cookies.toString(),
          authHeader: request.headers.get('authorization')
        });
        
        if (!token) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }

        try {
          const payload = AuthService.verifyToken(token);
          
          // Agregar información del usuario a los headers para las rutas API
          const requestHeaders = new Headers(request.headers);
          requestHeaders.set('x-user-id', payload.userId);
          requestHeaders.set('x-user-username', payload.username);
          requestHeaders.set('x-user-email', payload.email);

          return NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });
        } catch (error) {
          return NextResponse.json(
            { error: 'Invalid or expired token' },
            { status: 401 }
          );
        }
      }

      // Para todas las demás rutas, continuar sin autenticación
      return NextResponse.next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Helper para obtener información del usuario desde los headers en las rutas API
export function getUserFromHeaders(request: NextRequest) {
  return {
    userId: request.headers.get('x-user-id'),
    username: request.headers.get('x-user-username'),
    email: request.headers.get('x-user-email')
  };
}