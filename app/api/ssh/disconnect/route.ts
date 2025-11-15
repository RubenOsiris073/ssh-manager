import { NextRequest, NextResponse } from 'next/server';
import { getSSHManager } from '@/lib/ssh/manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const sshManager = getSSHManager();
    await sshManager.disconnect(sessionId);

    return NextResponse.json({ 
      success: true,
      message: 'Disconnected successfully'
    });
  } catch (error) {
    console.error('Disconnection error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to disconnect', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}