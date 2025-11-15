import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  iat: number;
  exp: number;
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-not-for-production';
  private static readonly JWT_EXPIRES_IN = '7d';
  private static readonly REFRESH_EXPIRES_IN = '30d';

  static generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(
      payload,
      this.JWT_SECRET,
      { 
        expiresIn: this.JWT_EXPIRES_IN,
        issuer: 'ssh-manager',
        audience: 'ssh-manager-users'
      }
    );
  }

  static generateRefreshToken(userId: string, username?: string, email?: string): string {
    return jwt.sign(
      { userId, username, email, type: 'refresh' },
      this.JWT_SECRET,
      { 
        expiresIn: this.REFRESH_EXPIRES_IN,
        issuer: 'ssh-manager',
        audience: 'ssh-manager-refresh'
      }
    );
  }

  static verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'ssh-manager',
        audience: 'ssh-manager-users'
      }) as JWTPayload;
      
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static verifyRefreshToken(token: string): { userId: string; username?: string; email?: string } {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'ssh-manager',
        audience: 'ssh-manager-refresh'
      }) as any;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }
      
      return { 
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email
      };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  static extractTokenFromRequest(request: NextRequest): string | null {
    // Buscar en header Authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Buscar en cookies
    const tokenCookie = request.cookies.get('auth-token');
    if (tokenCookie) {
      return tokenCookie.value;
    }

    return null;
  }

  static async authenticateRequest(request: NextRequest): Promise<JWTPayload> {
    const token = this.extractTokenFromRequest(request);
    
    if (!token) {
      throw new Error('No authentication token provided');
    }

    return this.verifyToken(token);
  }

  static createAuthCookies(token: string, refreshToken: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    return {
      authToken: {
        name: 'auth-token',
        value: token,
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict' as const,
        maxAge: 7 * 24 * 60 * 60, // 7 días
        path: '/'
      },
      refreshToken: {
        name: 'refresh-token', 
        value: refreshToken,
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict' as const,
        maxAge: 30 * 24 * 60 * 60, // 30 días
        path: '/api/auth'
      }
    };
  }

  static clearAuthCookies() {
    return {
      authToken: {
        name: 'auth-token',
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        maxAge: 0,
        path: '/'
      },
      refreshToken: {
        name: 'refresh-token',
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        maxAge: 0,
        path: '/api/auth'
      }
    };
  }
}