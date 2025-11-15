import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/database/postgresql';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDB();
    
    // Verificar conexión a la base de datos
    await db.testConnection();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'running'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed'
      },
      { status: 503 }
    );
  }
}