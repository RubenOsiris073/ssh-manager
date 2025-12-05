"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Wifi, WifiOff, Loader2, Home, Settings, FileText, History, Download } from "lucide-react"
import type { SSHConnection } from "./ssh-manager"
import { ConnectionGroups } from "./connection-groups"
import { cn } from "@/lib/utils"

interface ConnectionGroup {
  id: string
  name: string
  color: string
  isExpanded: boolean
  connectionIds: string[]
}

interface ConnectionSidebarProps {
  connections: SSHConnection[]
  activeConnection: string | null
  onConnect: (connectionId: string) => void
  onDisconnect: (connectionId: string) => void
  onAddConnection: () => void
  onSelectConnection: (connectionId: string) => void
  onEditConnection: (connection: SSHConnection) => void
  onDeleteConnection: (connectionId: string) => void
  onDuplicateConnection: (connection: SSHConnection) => void
  onShowHome: () => void
  showHome: boolean
  onShowDetails: (connection: SSHConnection) => void
  connectionGroups: ConnectionGroup[]
  onUpdateGroups: (groups: ConnectionGroup[]) => void
  onShowSettings: () => void
  onShowActivityLogs?: () => void
  onShowCommandHistory?: () => void
  onShowImportExport?: () => void
}

export function ConnectionSidebar({
  connections,
  activeConnection,
  onConnect,
  onDisconnect,
  onAddConnection,
  onSelectConnection,
  onEditConnection,
  onDeleteConnection,
  onDuplicateConnection,
  onShowHome,
  showHome,
  onShowDetails,
  connectionGroups,
  onUpdateGroups,
  onShowSettings,
  onShowActivityLogs,
  onShowCommandHistory,
  onShowImportExport,
}: ConnectionSidebarProps) {
  const getStatusIcon = (status: SSHConnection["status"]) => {
    switch (status) {
      case "connected":
        return <Wifi className="h-4 w-4 text-accent" />
      case "connecting":
        return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
      case "disconnected":
        return <WifiOff className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: SSHConnection["status"]) => {
    const variants = {
      connected: "bg-accent/20 text-accent border-accent/30",
      connecting: "bg-muted text-muted-foreground border-border",
      disconnected: "bg-destructive/20 text-destructive border-destructive/30",
    }

    return (
      <Badge variant="outline" className={cn("text-xs", variants[status])}>
        {status}
      </Badge>
    )
  }

  const handleOpenTerminal = (connectionId: string) => {
    const connection = connections.find((c) => c.id === connectionId)
    if (connection?.status === "disconnected") {
      onConnect(connectionId)
    } else {
      onSelectConnection(connectionId)
    }
  }

  return (
    <div className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-sidebar-foreground">SSH Manager</h1>
        </div>

        <div className="mb-4">
          <Button
            variant={showHome ? "default" : "ghost"}
            size="sm"
            onClick={onShowHome}
            className={cn(
              "w-full justify-start gap-2",
              showHome && "bg-sidebar-primary text-sidebar-primary-foreground",
            )}
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
        </div>

        <div className="text-sm text-sidebar-foreground/70">
          {connections.filter((c) => c.status === "connected").length} of {connections.length} connected
        </div>
      </div>

      {/* Connections List */}
      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="p-2">
          <ConnectionGroups
            connections={connections}
            groups={connectionGroups}
            onUpdateGroups={onUpdateGroups}
            onSelectConnection={onSelectConnection}
            activeConnection={activeConnection}
          />
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        {onShowActivityLogs && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowActivityLogs}
            className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            <FileText className="h-4 w-4" />
            Activity Logs
          </Button>
        )}

        {onShowCommandHistory && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowCommandHistory}
            className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            <History className="h-4 w-4" />
            Command History
          </Button>
        )}

        {onShowImportExport && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowImportExport}
            className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            <Download className="h-4 w-4" />
            Import / Export
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onShowSettings}
          className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>

        <div className="text-xs text-sidebar-foreground/50 text-center">SSH Manager v1.0</div>
      </div>
    </div>
  )
}
