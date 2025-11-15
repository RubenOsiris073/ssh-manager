import { createAuthMiddleware } from '@/lib/auth/auth-middleware';

// Configurar el middleware de autenticación
const authMiddleware = createAuthMiddleware();

export async function middleware(request: any) {
  return authMiddleware(request);
}

export const config = {
  matcher: [
    // Aplicar middleware a las rutas API que necesitan protección
    '/api/ssh/:path*',
    '/api/connections/:path*',
    '/api/terminal/:path*',
    '/api/auth/:path*'
  ]
};