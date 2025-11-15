import { NextRequest, NextResponse } from 'next/server';
import { getSSHManager } from '@/lib/ssh/manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, command, cwd } = body;

    if (!sessionId || !command) {
      return NextResponse.json(
        { error: 'Session ID and command are required' },
        { status: 400 }
      );
    }

    const sshManager = getSSHManager();
    const result = await sshManager.executeCommand(sessionId, command, cwd);

    return NextResponse.json({
      success: true,
      output: result.stdout,
      error: result.stderr,
      exitCode: result.code,
      command,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Command execution error:', error);
    const body = await request.json();
    const { command } = body;
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        command: command || '',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}