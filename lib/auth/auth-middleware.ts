import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/jwt';

export function createAuthMiddleware() {
  return async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Rutas públicas que no requieren autenticación
    const publicPaths = [
      '/api/auth/login',
      '/api/auth/register', 
      '/api/health'
    ];

    // Si es una ruta pública, permitir acceso
    if (publicPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    // Rutas API protegidas
    if (pathname.startsWith('/api/')) {
      try {
        const payload = await AuthService.authenticateRequest(request);
        
        // Agregar información del usuario al header para las rutas API
        const response = NextResponse.next();
        response.headers.set('x-user-id', payload.userId);
        response.headers.set('x-username', payload.username);
        
        return response;
      } catch (error) {
        console.error('Authentication failed:', error);
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    // Para rutas no-API, permitir que el componente maneje la autenticación
    return NextResponse.next();
  };
}