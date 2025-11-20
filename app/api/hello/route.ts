import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🎯 HELLO ROUTE HIT! Time:', new Date().toISOString());
  console.log('📍 URL:', request.url);
  
  return NextResponse.json({ 
    message: 'Hello from hello route!',
    timestamp: new Date().toISOString()
  });
}