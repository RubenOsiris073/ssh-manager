'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import { useAuth } from '@/contexts/auth-context';
import '@xterm/xterm/css/xterm.css';

export interface TerminalProps {
  connectionId: string;
  connection: {
    id: string;
    name: string;
    host: string;
    port: number;
    username: string;
  };
  onClose?: () => void;
  onConnectionChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
}

export default function Terminal({ connectionId, connection, onClose, onConnectionChange }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const updateStatus = useCallback((newStatus: typeof status) => {
    setStatus(newStatus);
    onConnectionChange?.(newStatus);
  }, [onConnectionChange]);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsPort = process.env.NEXT_PUBLIC_WS_PORT || '3001';
    const wsUrl = `${wsProtocol}//${window.location.hostname}:${wsPort}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('🔌 WebSocket connected');
      
      // Autenticar con token
      if (isAuthenticated) {
        // Por ahora usamos un token demo, en producción sería el JWT real
        ws.send(JSON.stringify({
          type: 'auth',
          token: 'demo-token'
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'welcome':
            console.log('👋 WebSocket welcome:', message.message);
            break;

          case 'auth_success':
            console.log('✅ WebSocket authenticated');
            // Iniciar conexión SSH
            ws.send(JSON.stringify({
              type: 'connect',
              connectionId: connectionId,
              cols: xtermRef.current?.cols || 80,
              rows: xtermRef.current?.rows || 24
            }));
            break;

          case 'auth_error':
            console.error('❌ WebSocket auth failed');
            updateStatus('error');
            xtermRef.current?.write('\r\n❌ Authentication failed\r\n');
            break;

          case 'connected':
            console.log('🔗 SSH connected');
            setCurrentSessionId(message.sessionId);
            updateStatus('connected');
            xtermRef.current?.write(`\r\n✅ Connected to ${connection.host}\r\n`);
            break;

          case 'data':
            if (message.data && xtermRef.current) {
              xtermRef.current.write(message.data);
            }
            break;

          case 'close':
            console.log('🔌 SSH connection closed');
            setCurrentSessionId(null);
            updateStatus('disconnected');
            xtermRef.current?.write('\r\n📱 SSH connection closed\r\n');
            break;

          case 'error':
            console.error('❌ SSH error:', message.message);
            updateStatus('error');
            xtermRef.current?.write(`\r\n❌ Error: ${message.message}\r\n`);
            break;

          default:
            console.log('📨 Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      updateStatus('error');
    };

    ws.onclose = (event) => {
      console.log('📱 WebSocket closed:', event.code, event.reason);
      
      if (!event.wasClean && !isReconnecting && status === 'connected') {
        setIsReconnecting(true);
        updateStatus('connecting');
        xtermRef.current?.write('\r\n🔄 Connection lost, reconnecting...\r\n');
        
        setTimeout(() => {
          setIsReconnecting(false);
          connectWebSocket();
        }, 3000);
      } else {
        updateStatus('disconnected');
      }
    };
  }, [connectionId, connection.host, status, isReconnecting, updateStatus]);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Crear terminal XTerm
    const xterm = new XTerm({
      theme: {
        background: '#0D1117',
        foreground: '#F0F6FC',
        cursor: '#F0F6FC',
        selectionBackground: '#264F78'
      },
      fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
      fontSize: 14,
      cursorBlink: true,
      allowProposedApi: true
    });

    // Addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    const searchAddon = new SearchAddon();

    xterm.loadAddon(fitAddon);
    xterm.loadAddon(webLinksAddon);
    xterm.loadAddon(searchAddon);

    fitAddonRef.current = fitAddon;
    xtermRef.current = xterm;

    // Abrir terminal en el DOM
    xterm.open(terminalRef.current);
    fitAddon.fit();

    // Mensaje de bienvenida
    xterm.write('🚀 SSH Manager Terminal\r\n');
    xterm.write(`📡 Connecting to ${connection.name} (${connection.host}:${connection.port})\r\n`);
    xterm.write('⏳ Please wait...\r\n\r\n');

    // Manejar entrada del usuario
    xterm.onData((data) => {
      if (wsRef.current?.readyState === WebSocket.OPEN && currentSessionId) {
        wsRef.current.send(JSON.stringify({
          type: 'data',
          data: data,
          sessionId: currentSessionId
        }));
      }
    });

    // Manejar redimensionamiento
    xterm.onResize(({ cols, rows }) => {
      if (wsRef.current?.readyState === WebSocket.OPEN && currentSessionId) {
        wsRef.current.send(JSON.stringify({
          type: 'resize',
          cols: cols,
          rows: rows,
          sessionId: currentSessionId
        }));
      }
    });

    // Conectar WebSocket
    connectWebSocket();

    // Cleanup
    return () => {
      if (wsRef.current && currentSessionId) {
        wsRef.current.send(JSON.stringify({ 
          type: 'disconnect',
          sessionId: currentSessionId 
        }));
        wsRef.current.close();
      }
      xterm.dispose();
    };
  }, [connection, connectWebSocket]);

  // Redimensionar cuando cambie el tamaño del contenedor
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current) {
        setTimeout(() => fitAddonRef.current?.fit(), 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDisconnect = () => {
    if (wsRef.current && currentSessionId) {
      wsRef.current.send(JSON.stringify({ 
        type: 'disconnect',
        sessionId: currentSessionId 
      }));
      wsRef.current.close();
    }
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full bg-[#0D1117] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-[#161B22] border-b border-[#30363D]">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            status === 'connected' ? 'bg-green-500' :
            status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
            status === 'error' ? 'bg-red-500' :
            'bg-gray-500'
          }`} />
          <div>
            <div className="text-sm font-medium text-white">
              {connection.name}
            </div>
            <div className="text-xs text-gray-400">
              {connection.username}@{connection.host}:{connection.port} - {status}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => fitAddonRef.current?.fit()}
            className="px-2 py-1 text-xs bg-[#21262D] text-gray-300 rounded hover:bg-[#30363D] transition-colors"
            title="Resize to fit"
          >
            Fit
          </button>
          <button
            onClick={handleDisconnect}
            className="px-2 py-1 text-xs bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
      
      <div 
        ref={terminalRef} 
        className="flex-1 p-2"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}