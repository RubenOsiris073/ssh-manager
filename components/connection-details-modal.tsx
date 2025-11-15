"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Server, User, Globe, Clock, Activity, Copy, Edit, Trash2, Play, Square } from "lucide-react"
import type { SSHConnection } from "./ssh-manager"
import { toast } from "@/hooks/use-toast"

interface ConnectionDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connection: SSHConnection | null
  onConnect: (id: string) => void
  onDisconnect: (id: string) => void
  onEdit: (connection: SSHConnection) => void
  onDelete: (id: string) => void
  onDuplicate: (connection: SSHConnection) => void
}

export function ConnectionDetailsModal({
  open,
  onOpenChange,
  connection,
  onConnect,
  onDisconnect,
  onEdit,
  onDelete,
  onDuplicate,
}: ConnectionDetailsModalProps) {
  if (!connection) return null

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "connecting":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Server className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-card-foreground">{connection.name}</DialogTitle>
                <DialogDescription className="text-muted-foreground">Connection Details</DialogDescription>
              </div>
            </div>
            <Badge className={getStatusColor(connection.status)}>
              <Activity className="h-3 w-3 mr-1" />
              {connection.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="h-4 w-4" />
                Host
              </div>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                  {connection.host}:{connection.port}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(`${connection.host}:${connection.port}`, "Host")}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                Username
              </div>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{connection.username}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(connection.username, "Username")}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {connection.lastConnected && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Last Connected
              </div>
              <div className="text-sm">{connection.lastConnected.toLocaleString()}</div>
            </div>
          )}

          <Separator />

          <div className="flex flex-wrap gap-2">
            {connection.status === "connected" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDisconnect(connection.id)}
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Square className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => onConnect(connection.id)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Play className="h-4 w-4 mr-2" />
                Connect
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(connection)}
              className="border-border hover:bg-muted"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onDuplicate(connection)}
              className="border-border hover:bg-muted"
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(connection.id)}
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
