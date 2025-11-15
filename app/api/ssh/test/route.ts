import { NextRequest, NextResponse } from 'next/server';
import { getSSHManager } from '@/lib/ssh/manager';
import { getDB } from '@/lib/database/json-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { host, port = 22, username, password, privateKey } = body;

    if (!host || !username) {
      return NextResponse.json(
        { error: 'Host and username are required' },
        { status: 400 }
      );
    }

    const sshManager = getSSHManager();
    const testResult = await sshManager.testConnection({
      host,
      port: Number(port),
      username,
      password,
      privateKey
    });

    return NextResponse.json(testResult);
  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}