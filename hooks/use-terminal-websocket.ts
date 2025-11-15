import { useEffect, useRef, useState, useCallback } from 'react';

export interface TerminalMessage {
  type: 'connected' | 'output' | 'error' | 'disconnected' | 'prompt' | 'pong';
  sessionId?: string;
  content?: string;
  error?: string;
  command?: string;
  exitCode?: number;
  timestamp: string;
  success?: boolean;
  sshSessionId?: string;
}

export interface WebSocketMessage {
  type: 'connect' | 'execute' | 'disconnect' | 'ping';
  sessionId: string;
  command?: string;
  connectionConfig?: any;
}

export function useTerminalWebSocket(url: string) {
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [sessions, setSessions] = useState<Map<string, string>>(new Map());

  const connect = useCallback(() => {
    try {
      ws.current = new WebSocket(url);
      
      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        
        // Reconectar automáticamente después de 3 segundos
        setTimeout(() => {
          if (!connected) {
            connect();
          }
        }, 3000);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnected(false);
      };

      ws.current.onmessage = (event) => {
        try {
          const message: TerminalMessage = JSON.parse(event.data);
          
          setMessages(prev => [...prev, message]);
          
          // Si es una conexión exitosa, guardar el mapeo de sesión
          if (message.type === 'connected' && message.sessionId && message.sshSessionId) {
            setSessions(prev => new Map(prev.set(message.sessionId!, message.sshSessionId!)));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }, [url, connected]);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
      setConnected(false);
    }
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected');
    }
  }, []);

  const connectSSH = useCallback((sessionId: string, connectionConfig: any) => {
    sendMessage({
      type: 'connect',
      sessionId,
      connectionConfig
    });
  }, [sendMessage]);

  const executeCommand = useCallback((sessionId: string, command: string) => {
    sendMessage({
      type: 'execute',
      sessionId,
      command
    });
  }, [sendMessage]);

  const disconnectSSH = useCallback((sessionId: string) => {
    sendMessage({
      type: 'disconnect',
      sessionId
    });
    
    // Limpiar el mapeo de sesión
    setSessions(prev => {
      const newSessions = new Map(prev);
      newSessions.delete(sessionId);
      return newSessions;
    });
  }, [sendMessage]);

  const clearMessages = useCallback((sessionId?: string) => {
    if (sessionId) {
      setMessages(prev => prev.filter(msg => msg.sessionId !== sessionId));
    } else {
      setMessages([]);
    }
  }, []);

  const getSessionMessages = useCallback((sessionId: string) => {
    return messages.filter(msg => msg.sessionId === sessionId);
  }, [messages]);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, []);

  // Ping para mantener la conexión activa
  useEffect(() => {
    if (!connected) return;
    
    const interval = setInterval(() => {
      sendMessage({
        type: 'ping',
        sessionId: 'ping'
      });
    }, 30000); // Ping cada 30 segundos

    return () => clearInterval(interval);
  }, [connected, sendMessage]);

  return {
    connected,
    messages,
    sessions,
    connect,
    disconnect,
    connectSSH,
    executeCommand,
    disconnectSSH,
    clearMessages,
    getSessionMessages
  };
}