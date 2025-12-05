"use client"

import { useState, useEffect } from "react"
import { sshService } from "@/lib/ssh/service"
import { useAuth } from "@/contexts/auth-context"
import { ConnectionSidebar } from "./connection-sidebar"
import dynamic from 'next/dynamic';

const TerminalArea = dynamic(() => import('./terminal-area').then(mod => ({ default: mod.TerminalArea })), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-black text-green-400 p-4 font-mono text-sm">
      <div className="animate-pulse">⚡ Loading terminal area...</div>
    </div>
  )
});
import { ConnectionDialog } from "./connection-dialog"
import { HomeScreen } from "./home-screen"
import { toast } from "@/hooks/use-toast"
import { ConnectionDetailsModal } from "./connection-details-modal"
import { ConfirmationModal } from "./confirmation-modal"
import { SettingsModal } from "./settings-modal"
import { ActivityLogs } from "./activity-logs"
import { CommandHistory } from "./command-history"
import { ImportExportModal } from "./import-export-modal"
import { Button } from "@/components/ui/button"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

export interface SSHConnection {
  id: string
  name: string
  host: string
  port: number
  username: string
  status: "connected" | "disconnected" | "connecting"
  lastConnected?: Date
  groupId?: string
  notes?: string
  password?: string
}

interface ConnectionGroup {
  id: string
  name: string
  color: string
  isExpanded: boolean
  connectionIds: string[]
}

export function SSHManager() {
  const { user, logout } = useAuth();
  
  const [connections, setConnections] = useState<SSHConnection[]>([
    {
      id: "1",
      name: "Production Server",
      host: "192.168.1.100",
      port: 22,
      username: "root",
      status: "connected",
      lastConnected: new Date(),
    },
    {
      id: "2",
      name: "Development Server",
      host: "dev.example.com",
      port: 2222,
      username: "developer",
      status: "disconnected",
      lastConnected: new Date(Date.now() - 86400000),
    },
    {
      id: "3",
      name: "Staging Environment",
      host: "staging.example.com",
      port: 22,
      username: "deploy",
      status: "connecting",
    },
  ])

  const [connectionGroups, setConnectionGroups] = useState<ConnectionGroup[]>([
    {
      id: "1",
      name: "Production",
      color: "bg-red-500/20 text-red-400 border-red-500/30",
      isExpanded: true,
      connectionIds: ["1"],
    },
    {
      id: "2",
      name: "Development",
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      isExpanded: true,
      connectionIds: ["2", "3"],
    },
  ])

  const [activeConnection, setActiveConnection] = useState<string | null>(null)
  const [showHome, setShowHome] = useState(true)
  const [showConnectionDialog, setShowConnectionDialog] = useState(false)
  const [editingConnection, setEditingConnection] = useState<SSHConnection | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedConnection, setSelectedConnection] = useState<SSHConnection | null>(null)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [connectionToDelete, setConnectionToDelete] = useState<SSHConnection | null>(null)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showActivityLogs, setShowActivityLogs] = useState(false)
  const [showCommandHistory, setShowCommandHistory] = useState(false)
  const [showImportExport, setShowImportExport] = useState(false)

  // Cargar conexiones desde la API al montar el componente
  useEffect(() => {
    const loadConnections = async () => {
      try {
        const apiConnections = await sshService.getAllConnections()
        console.log('Loaded connections from API:', apiConnections)
        setConnections(apiConnections)
      } catch (error) {
        console.error('Failed to load connections:', error)
        // Mantener las conexiones de ejemplo si falla la API
        toast({
          title: "API Warning",
          description: "Using fallback data. Backend may not be running.",
          variant: "destructive"
        })
      }
    }

    loadConnections()
  }, [])

  const handleConnect = async (connectionId: string) => {
    setConnections((prev) =>
      prev.map((conn) => (conn.id === connectionId ? { ...conn, status: "connecting" as const } : conn)),
    )

    try {
      const result = await sshService.connect(connectionId)
      
      setConnections((prev) =>
        prev.map((conn) =>
          conn.id === connectionId ? { ...conn, status: "connected" as const, lastConnected: new Date() } : conn,
        ),
      )
      setActiveConnection(connectionId)
      setShowHome(false)

      const connection = connections.find((c) => c.id === connectionId)
      if (connection) {
        toast({
          title: "Connected",
          description: result.message || `Successfully connected to ${connection.name}`,
        })
      }
    } catch (error) {
      setConnections((prev) =>
        prev.map((conn) => (conn.id === connectionId ? { ...conn, status: "disconnected" as const } : conn)),
      )
      
      const connection = connections.find((c) => c.id === connectionId)
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to server",
        variant: "destructive",
      })
    }
  }

  const handleDisconnect = (connectionId: string) => {
    setConnections((prev) =>
      prev.map((conn) => (conn.id === connectionId ? { ...conn, status: "disconnected" as const } : conn)),
    )

    if (activeConnection === connectionId) {
      setActiveConnection(null)
      setShowHome(true)
    }

    const connection = connections.find((c) => c.id === connectionId)
    if (connection) {
      toast({
        title: "Disconnected",
        description: `Disconnected from ${connection.name}`,
        variant: "destructive",
      })
    }
  }

  const handleAddConnection = async (connection: Omit<SSHConnection, "id" | "status">) => {
    try {
      const newConnection = await sshService.createConnection(connection)
      setConnections((prev) => [...prev, newConnection])
      setShowConnectionDialog(false)

      toast({
        title: "Connection Added",
        description: `${connection.name} has been added to your connections`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add connection",
        variant: "destructive",
      })
    }
  }

  const handleConnectionCreated = (connection: SSHConnection) => {
    // Solo actualizar estado local, la conexión ya fue guardada en DB
    setConnections((prev) => [...prev, connection])
  }

  const handleEditConnection = (connection: SSHConnection) => {
    setEditingConnection(connection)
    setShowConnectionDialog(true)
  }

  const handleUpdateConnection = (updatedConnection: Omit<SSHConnection, "id" | "status">) => {
    if (!editingConnection) return

    setConnections((prev) =>
      prev.map((conn) => (conn.id === editingConnection.id ? { ...conn, ...updatedConnection } : conn)),
    )

    setEditingConnection(null)
    setShowConnectionDialog(false)

    toast({
      title: "Connection Updated",
      description: `${updatedConnection.name} has been updated`,
    })
  }

  const handleDeleteConnection = (connectionId: string) => {
    const connection = connections.find((c) => c.id === connectionId)
    if (connection) {
      setConnectionToDelete(connection)
      setShowDeleteConfirmation(true)
    }
  }

  const handleConfirmDelete = async () => {
    if (!connectionToDelete) return

    try {
      // Llamar al API para eliminar la conexión permanentemente
      await sshService.deleteConnection(connectionToDelete.id)

      // Actualizar el estado local después de la eliminación exitosa
      setConnections((prev) => prev.filter((conn) => conn.id !== connectionToDelete.id))

      if (activeConnection === connectionToDelete.id) {
        setActiveConnection(null)
        setShowHome(true)
      }

      toast({
        title: "Connection Deleted",
        description: `${connectionToDelete.name} has been permanently removed`,
        variant: "destructive",
      })

      setConnectionToDelete(null)
      setShowDeleteConfirmation(false)
    } catch (error) {
      console.error('Error deleting connection:', error)
      toast({
        title: "Error",
        description: "Failed to delete connection. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleShowDetails = (connection: SSHConnection) => {
    setSelectedConnection(connection)
    setShowDetailsModal(true)
  }

  const handleCloseDialog = () => {
    setShowConnectionDialog(false)
    setEditingConnection(null)
  }

  const handleShowHome = () => {
    setActiveConnection(null)
    setShowHome(true)
  }

  const handleDuplicateConnection = (connection: SSHConnection) => {
    const newConnection: SSHConnection = {
      ...connection,
      id: Date.now().toString(),
      status: "disconnected",
    }
    setConnections((prev) => [...prev, newConnection])

    toast({
      title: "Connection Duplicated",
      description: `${connection.name} has been duplicated`,
    })
  }

  const handleExecuteCommand = (command: string) => {
    console.log("Execute command:", command)
  }

  const handleImportConnections = (newConnections: SSHConnection[]) => {
    setConnections((prev) => [...prev, ...newConnections])
    toast({
      title: "Import Successful",
      description: `Imported ${newConnections.length} connections`,
    })
  }

  const handleImportGroups = (newGroups: ConnectionGroup[]) => {
    setConnectionGroups((prev) => [...prev, ...newGroups])
    toast({
      title: "Import Successful",
      description: `Imported ${newGroups.length} groups`,
    })
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <div
        className={`transition-all duration-300 ease-in-out ${
          sidebarVisible ? "w-80 opacity-100" : "w-0 opacity-0 overflow-hidden"
        }`}
      >
        <ConnectionSidebar
          connections={connections}
          activeConnection={activeConnection}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onAddConnection={() => setShowConnectionDialog(true)}
          onSelectConnection={setActiveConnection}
          onEditConnection={handleEditConnection}
          onDeleteConnection={handleDeleteConnection}
          onDuplicateConnection={handleDuplicateConnection}
          onShowHome={handleShowHome}
          showHome={showHome}
          onShowDetails={handleShowDetails}
          connectionGroups={connectionGroups}
          onUpdateGroups={setConnectionGroups}
          onShowSettings={() => setShowSettingsModal(true)}
          onShowActivityLogs={() => setShowActivityLogs(true)}
          onShowCommandHistory={() => setShowCommandHistory(true)}
          onShowImportExport={() => setShowImportExport(true)}
        />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-2 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarVisible(!sidebarVisible)}
              className="text-muted-foreground hover:text-foreground"
            >
              {sidebarVisible ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </Button>

            {!sidebarVisible && (
              <div className="text-sm text-muted-foreground">
                {activeConnection
                  ? connections.find((c) => c.id === activeConnection)?.name || "Terminal"
                  : "SSH Manager"}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              Welcome, <span className="text-foreground font-medium">{user?.username}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              className="text-xs"
            >
              Logout
            </Button>
          </div>
        </div>

        {showHome ? (
          <HomeScreen
            connections={connections}
            onConnect={handleConnect}
            onAddConnection={handleAddConnection}
            onConnectionCreated={handleConnectionCreated}
            onEditConnection={handleEditConnection}
            onDeleteConnection={handleDeleteConnection}
            onShowDetails={handleShowDetails}
          />
        ) : (
          <TerminalArea connections={connections} activeConnection={activeConnection} />
        )}
      </div>

      <ConnectionDialog
        open={showConnectionDialog}
        onOpenChange={handleCloseDialog}
        onAddConnection={editingConnection ? handleUpdateConnection : handleAddConnection}
        editingConnection={editingConnection}
      />

      <ConnectionDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        connection={selectedConnection}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onEdit={handleEditConnection}
        onDelete={handleDeleteConnection}
        onDuplicate={handleDuplicateConnection}
      />

      <ConfirmationModal
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
        onConfirm={handleConfirmDelete}
        title="Delete Connection"
        description={`Are you sure you want to delete "${connectionToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        icon="delete"
      />

      <SettingsModal open={showSettingsModal} onOpenChange={setShowSettingsModal} />

      <ActivityLogs open={showActivityLogs} onOpenChange={setShowActivityLogs} connections={connections} />

      <CommandHistory
        open={showCommandHistory}
        onOpenChange={setShowCommandHistory}
        connections={connections}
        onExecuteCommand={handleExecuteCommand}
      />

      <ImportExportModal
        open={showImportExport}
        onOpenChange={setShowImportExport}
        connections={connections}
        groups={connectionGroups}
        onImportConnections={handleImportConnections}
        onImportGroups={handleImportGroups}
      />
    </div>
  )
}
