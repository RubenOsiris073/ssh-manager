"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Plus } from "lucide-react"
import type { SSHConnection } from "./ssh-manager"
import { cn } from "@/lib/utils"

export interface TerminalTab {
  id: string
  connectionId: string
  title: string
  isActive: boolean
}

interface TerminalTabsProps {
  tabs: TerminalTab[]
  connections: SSHConnection[]
  onTabSelect: (tabId: string) => void
  onTabClose: (tabId: string) => void
  onNewTab: () => void
}

export function TerminalTabs({ tabs, connections, onTabSelect, onTabClose, onNewTab }: TerminalTabsProps) {
  const getConnectionName = (connectionId: string) => {
    const connection = connections.find((c) => c.id === connectionId)
    return connection?.name || "Unknown"
  }

  const getConnectionStatus = (connectionId: string) => {
    const connection = connections.find((c) => c.id === connectionId)
    return connection?.status || "disconnected"
  }

  return (
    <div className="bg-card border-b border-border flex items-center">
      <ScrollArea className="flex-1">
        <div className="flex items-center">
          {tabs.map((tab) => {
            const status = getConnectionStatus(tab.connectionId)
            return (
              <div
                key={tab.id}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 border-r border-border cursor-pointer transition-colors min-w-0 max-w-48",
                  tab.isActive
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
                onClick={() => onTabSelect(tab.id)}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      status === "connected" && "bg-accent",
                      status === "connecting" && "bg-muted-foreground animate-pulse",
                      status === "disconnected" && "bg-destructive",
                    )}
                  />
                  <span className="text-sm font-medium truncate">{getConnectionName(tab.connectionId)}</span>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-4 w-4 p-0 hover:bg-destructive/20 hover:text-destructive flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    onTabClose(tab.id)
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      <Button size="sm" variant="ghost" onClick={onNewTab} className="h-8 w-8 p-0 mx-2 hover:bg-muted">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
