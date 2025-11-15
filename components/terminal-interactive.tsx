"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Terminal, Wifi, WifiOff, Loader2 } from "lucide-react"
import { useTerminalWebSocket } from "@/hooks/use-terminal-websocket"
import { cn } from "@/lib/utils"

interface TerminalInteractiveProps {
  connection: any
  sessionId: string
  isActive: boolean
}

interface TerminalLine {
  id: string
  type: 'input' | 'output' | 'error' | 'system'
  content: string
  timestamp: Date
  command?: string
}

export function TerminalInteractive({ connection, sessionId, isActive }: TerminalInteractiveProps) {
  const [lines, setLines] = useState<TerminalLine[]>([])
  const [currentInput, setCurrentInput] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // WebSocket para terminal
  const wsUrl = `ws://localhost:3000/api/terminal/ws`
  const { 
    connected: wsConnected, 
    connectSSH, 
    executeCommand, 
    disconnectSSH, 
    getSessionMessages 
  } = useTerminalWebSocket(wsUrl)

  // Agregar nueva línea al terminal
  const addLine = (type: TerminalLine['type'], content: string, command?: string) => {
    const newLine: TerminalLine = {
      id: Date.now().toString() + Math.random(),
      type,
      content,
      timestamp: new Date(),
      command
    }
    setLines(prev => [...prev, newLine])
  }

  // Conectar SSH cuando el componente se monta
  useEffect(() => {
    if (wsConnected && connection && !isConnected && !isConnecting) {
      setIsConnecting(true)
      addLine('system', `Connecting to ${connection.host}...`)
      
      connectSSH(sessionId, connection)
    }
  }, [wsConnected, connection, isConnected, isConnecting, sessionId, connectSSH])

  // Escuchar mensajes del WebSocket
  useEffect(() => {
    const messages = getSessionMessages(sessionId)
    
    messages.forEach(message => {
      switch (message.type) {
        case 'connected':
          setIsConnected(true)
          setIsConnecting(false)
          addLine('system', `✅ Connected to ${connection?.host}`)
          if (message.content) {
            addLine('output', message.content)
          }
          break
          
        case 'output':
          if (message.content) {
            addLine('output', message.content, message.command)
          }
          break
          
        case 'error':
          setIsConnecting(false)
          if (message.error) {
            addLine('error', `❌ ${message.error}`, message.command)
          }
          break
          
        case 'disconnected':
          setIsConnected(false)
          addLine('system', '🔌 Disconnected')
          break
          
        case 'prompt':
          if (message.content) {
            addLine('output', message.content)
          }
          break
      }
    })
  }, [getSessionMessages, sessionId, connection])

  // Auto-scroll al final
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lines])

  // Focus en input cuando está activo
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isActive])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentInput.trim() && isConnected) {
      const command = currentInput.trim()
      
      // Agregar comando al historial
      addLine('input', `$ ${command}`, command)
      
      // Ejecutar comando via WebSocket
      executeCommand(sessionId, command)
      
      // Limpiar input
      setCurrentInput("")
    }
  }

  const handleDisconnect = () => {
    if (isConnected) {
      disconnectSSH(sessionId)
      setIsConnected(false)
    }
  }

  const getConnectionStatus = () => {
    if (isConnecting) return { icon: Loader2, text: "Connecting...", className: "text-yellow-500 animate-spin" }
    if (isConnected) return { icon: Wifi, text: "Connected", className: "text-green-500" }
    return { icon: WifiOff, text: "Disconnected", className: "text-red-500" }
  }

  const status = getConnectionStatus()
  const StatusIcon = status.icon

  return (
    <div className="flex flex-col h-full bg-gray-900 text-green-400 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          <span className="text-sm">{connection?.name || 'Terminal'}</span>
          <div className="flex items-center gap-1">
            <StatusIcon className={cn("h-3 w-3", status.className)} />
            <span className="text-xs text-gray-400">{status.text}</span>
          </div>
        </div>
        
        {isConnected && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            className="text-xs"
          >
            Disconnect
          </Button>
        )}
      </div>

      {/* Terminal Output */}
      <ScrollArea className="flex-1 p-2" ref={scrollRef}>
        <div className="space-y-1">
          {lines.map((line) => (
            <div
              key={line.id}
              className={cn(
                "text-sm whitespace-pre-wrap",
                line.type === 'input' && "text-cyan-400",
                line.type === 'output' && "text-green-400", 
                line.type === 'error' && "text-red-400",
                line.type === 'system' && "text-yellow-400 italic"
              )}
            >
              {line.content}
            </div>
          ))}
          
          {/* Cursor */}
          {isConnected && (
            <div className="flex items-center">
              <span className="text-cyan-400 mr-1">$ </span>
              <Input
                ref={inputRef}
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none p-0 text-green-400 font-mono focus:ring-0"
                placeholder={isConnected ? "Enter command..." : "Not connected"}
                disabled={!isConnected}
              />
              <span className="w-2 h-4 bg-green-400 ml-1 animate-pulse"></span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Status bar */}
      <div className="p-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
        {connection?.host}:{connection?.port} | {connection?.username} | WebSocket: {wsConnected ? '✅' : '❌'}
      </div>
    </div>
  )
}