"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Server, Plus, Clock, User, Globe, Key, Trash2, Edit, Play } from "lucide-react"
import type { SSHConnection } from "./ssh-manager"
import { cn } from "@/lib/utils"

interface HomeScreenProps {
  connections: SSHConnection[]
  onConnect: (connectionId: string) => void
  onAddConnection: (connection: Omit<SSHConnection, "id" | "status">) => void
  onEditConnection: (connection: SSHConnection) => void
  onDeleteConnection: (connectionId: string) => void
}

interface QuickConnectForm {
  host: string
  username: string
  password: string
  port: string
}

export function HomeScreen({
  connections,
  onConnect,
  onAddConnection,
  onEditConnection,
  onDeleteConnection,
}: HomeScreenProps) {
  const [showQuickConnect, setShowQuickConnect] = useState(false)
  const [quickConnectForm, setQuickConnectForm] = useState<QuickConnectForm>({
    host: "",
    username: "",
    password: "",
    port: "22",
  })

  const handleQuickConnect = () => {
    if (!quickConnectForm.host || !quickConnectForm.username) return

    const newConnection = {
      name: `${quickConnectForm.username}@${quickConnectForm.host}`,
      host: quickConnectForm.host,
      username: quickConnectForm.username,
      port: Number.parseInt(quickConnectForm.port) || 22,
      lastConnected: new Date(),
    }

    onAddConnection(newConnection)
    setShowQuickConnect(false)
    setQuickConnectForm({ host: "", username: "", password: "", port: "22" })
  }

  const getStatusColor = (status: SSHConnection["status"]) => {
    switch (status) {
      case "connected":
        return "bg-green-500"
      case "connecting":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: SSHConnection["status"]) => {
    switch (status) {
      case "connected":
        return "Connected"
      case "connecting":
        return "Connecting"
      default:
        return "Disconnected"
    }
  }

  const recentConnections = connections
    .filter((conn) => conn.lastConnected)
    .sort((a, b) => (b.lastConnected?.getTime() || 0) - (a.lastConnected?.getTime() || 0))
    .slice(0, 3)

  return (
    <div className="flex-1 bg-background p-6 overflow-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Server className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">SSH Manager</h1>
          </div>
          <p className="text-muted-foreground text-lg">Manage your SSH connections and terminal sessions</p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Dialog open={showQuickConnect} onOpenChange={setShowQuickConnect}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                Quick Connect
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Quick Connect</DialogTitle>
                <DialogDescription>Connect to a server using SSH credentials</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault()
                handleQuickConnect()
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="host">Host / IP Address</Label>
                  <Input
                    id="host"
                    placeholder="192.168.1.100 or server.example.com"
                    value={quickConnectForm.host}
                    onChange={(e) => setQuickConnectForm((prev) => ({ ...prev, host: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="root"
                      value={quickConnectForm.username}
                      onChange={(e) => setQuickConnectForm((prev) => ({ ...prev, username: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="port">Port</Label>
                    <Input
                      id="port"
                      placeholder="22"
                      value={quickConnectForm.port}
                      onChange={(e) => setQuickConnectForm((prev) => ({ ...prev, port: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={quickConnectForm.password}
                    onChange={(e) => setQuickConnectForm((prev) => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={!quickConnectForm.host || !quickConnectForm.username}
                    className="flex-1"
                  >
                    Connect
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowQuickConnect(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="lg" className="gap-2 bg-transparent">
            <Key className="h-4 w-4" />
            Import Keys
          </Button>
        </div>

        {/* Recent Connections */}
        {recentConnections.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Connections
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentConnections.map((connection) => (
                <Card key={connection.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{connection.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {connection.username}@{connection.host}:{connection.port}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={cn("w-2 h-2 rounded-full", getStatusColor(connection.status))} />
                        <Badge variant="secondary" className="text-xs">
                          {getStatusText(connection.status)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {connection.lastConnected?.toLocaleDateString()}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            onConnect(connection.id)
                          }}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditConnection(connection)
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteConnection(connection.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Connections */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Globe className="h-5 w-5" />
              All Connections ({connections.length})
            </h2>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Plus className="h-4 w-4" />
              Add Connection
            </Button>
          </div>

          {connections.length === 0 ? (
            <Card className="p-8">
              <div className="text-center space-y-4">
                <Server className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No connections yet</h3>
                  <p className="text-muted-foreground mb-4">Add your first SSH connection to get started</p>
                  <Button onClick={() => setShowQuickConnect(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Connection
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {connections.map((connection) => (
                <Card key={connection.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 min-w-0 flex-1">
                        <CardTitle className="text-base truncate">{connection.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 text-xs">
                          <User className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {connection.username}@{connection.host}
                          </span>
                        </CardDescription>
                      </div>
                      <div
                        className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-1", getStatusColor(connection.status))}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        Port {connection.port}
                      </Badge>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            onConnect(connection.id)
                          }}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditConnection(connection)
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteConnection(connection.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
