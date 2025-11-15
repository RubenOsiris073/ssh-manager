"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Terminal as TerminalIcon, Plus, X, Settings, Maximize2, Minimize2 } from "lucide-react"
import type { SSHConnection } from "./ssh-manager"
import { Terminal } from './terminal-client'
import { cn } from "@/lib/utils"

interface TerminalAreaProps {
  connections: SSHConnection[]
  activeConnection: string | null
}

interface TerminalTab {
  id: string
  connectionId: string
  title: string
  isActive: boolean
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
}

export function TerminalArea({ connections, activeConnection }: TerminalAreaProps) {
  const [tabs, setTabs] = useState<TerminalTab[]>([])
  const [activeTab, setActiveTab] = useState<string | null>(null)

  const activeConnectionData = connections.find((c) => c.id === activeConnection)

  // Crear nueva pestaña cuando hay una conexión activa
  useEffect(() => {
    if (activeConnection && activeConnectionData?.status === "connected") {
      setTabs((currentTabs) => {
        const existingTab = currentTabs.find((tab) => tab.connectionId === activeConnection)

        if (!existingTab) {
          const newTabId = `tab-${activeConnection}-${Date.now()}`
          const newTab: TerminalTab = {
            id: newTabId,
            connectionId: activeConnection,
            title: activeConnectionData.name,
            isActive: true,
            status: 'connecting'
          }

          setActiveTab(newTabId)
          return [...currentTabs.map((t) => ({ ...t, isActive: false })), newTab]
        } else {
          setActiveTab(existingTab.id)
          return currentTabs.map((tab) => ({
            ...tab,
            isActive: tab.id === existingTab.id,
          }))
        }
      })
    }
  }, [activeConnection, activeConnectionData?.status, activeConnectionData?.name])

  const handleTabSelect = useCallback((tabId: string) => {
    setTabs((prev) => prev.map((tab) => ({
      ...tab,
      isActive: tab.id === tabId,
    })))
    setActiveTab(tabId)
  }, [])

  const handleTabClose = useCallback((tabId: string) => {
    setTabs((currentTabs) => {
      const newTabs = currentTabs.filter((t) => t.id !== tabId)
      
      // Si cerramos la pestaña activa, seleccionar otra
      const closingActiveTab = currentTabs.find((t) => t.id === tabId)?.isActive
      if (closingActiveTab && newTabs.length > 0) {
        const nextTab = newTabs[0]
        setActiveTab(nextTab.id)
        return newTabs.map((t) => ({
          ...t,
          isActive: t.id === nextTab.id,
        }))
      } else if (newTabs.length === 0) {
        setActiveTab(null)
      }
      
      return newTabs
    })
  }, [])

  const handleConnectionStatusChange = useCallback((tabId: string, status: TerminalTab['status']) => {
    setTabs((prev) => prev.map((tab) => 
      tab.id === tabId ? { ...tab, status } : tab
    ))
  }, [])

  const handleTerminalClose = useCallback(() => {
    if (activeTab) {
      handleTabClose(activeTab)
    }
  }, [activeTab, handleTabClose])

  const currentTab = tabs.find((tab) => tab.id === activeTab)
  const currentConnection = currentTab ? connections.find((c) => c.id === currentTab.connectionId) : null

  if (tabs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-muted/10 border-l border-border">
        <div className="text-center space-y-4">
          <TerminalIcon className="h-16 w-16 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-medium text-foreground">No Terminal Active</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Select a connection from the sidebar to open a terminal session
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-background border-l border-border">
      {/* Tabs Header */}
      <div className="flex items-center bg-muted/30 border-b border-border min-h-[48px]">
        <div className="flex-1 flex items-center">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                "group flex items-center gap-2 px-3 py-2 border-r border-border cursor-pointer transition-colors",
                tab.isActive 
                  ? "bg-background text-foreground" 
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              )}
              onClick={() => handleTabSelect(tab.id)}
            >
              <div className={cn(
                "w-2 h-2 rounded-full",
                tab.status === 'connected' && "bg-green-500",
                tab.status === 'connecting' && "bg-yellow-500 animate-pulse",
                tab.status === 'disconnected' && "bg-gray-500",
                tab.status === 'error' && "bg-red-500"
              )} />
              
              <span className="text-sm font-medium truncate max-w-[120px]">
                {tab.title}
              </span>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleTabClose(tab.id)
                }}
                className="opacity-0 group-hover:opacity-100 hover:bg-muted rounded p-1 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex items-center gap-1 px-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => console.log('Settings')}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 relative">
        {currentConnection && currentTab ? (
          <Terminal
            key={currentTab.id}
            connectionId={currentConnection.id}
            connection={{
              id: currentConnection.id,
              name: currentConnection.name,
              host: currentConnection.host,
              port: currentConnection.port,
              username: currentConnection.username,
            }}
            onClose={handleTerminalClose}
            onConnectionChange={(status) => 
              handleConnectionStatusChange(currentTab.id, status)
            }
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <TerminalIcon className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Loading terminal...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TerminalArea;