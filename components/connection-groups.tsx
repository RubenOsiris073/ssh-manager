"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Folder, FolderOpen, Plus, Edit2, Trash2, ChevronRight, ChevronDown } from "lucide-react"
import type { SSHConnection } from "./ssh-manager"
import { cn } from "@/lib/utils"

interface ConnectionGroup {
  id: string
  name: string
  color: string
  isExpanded: boolean
  connectionIds: string[]
}

interface ConnectionGroupsProps {
  connections: SSHConnection[]
  groups: ConnectionGroup[]
  onUpdateGroups: (groups: ConnectionGroup[]) => void
  onSelectConnection: (connectionId: string) => void
  activeConnection: string | null
}

export function ConnectionGroups({
  connections,
  groups,
  onUpdateGroups,
  onSelectConnection,
  activeConnection,
}: ConnectionGroupsProps) {
  const [editingGroup, setEditingGroup] = useState<string | null>(null)
  const [newGroupName, setNewGroupName] = useState("")
  const [showAddGroup, setShowAddGroup] = useState(false)

  const ungroupedConnections = connections.filter(
    (conn) => !groups.some((group) => group.connectionIds.includes(conn.id)),
  )

  const groupColors = [
    "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "bg-green-500/20 text-green-400 border-green-500/30",
    "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "bg-pink-500/20 text-pink-400 border-pink-500/30",
  ]

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      const newGroup: ConnectionGroup = {
        id: Date.now().toString(),
        name: newGroupName.trim(),
        color: groupColors[groups.length % groupColors.length],
        isExpanded: true,
        connectionIds: [],
      }
      onUpdateGroups([...groups, newGroup])
      setNewGroupName("")
      setShowAddGroup(false)
    }
  }

  const handleToggleGroup = (groupId: string) => {
    onUpdateGroups(groups.map((group) => (group.id === groupId ? { ...group, isExpanded: !group.isExpanded } : group)))
  }

  const handleRenameGroup = (groupId: string, newName: string) => {
    onUpdateGroups(groups.map((group) => (group.id === groupId ? { ...group, name: newName } : group)))
    setEditingGroup(null)
  }

  const handleDeleteGroup = (groupId: string) => {
    onUpdateGroups(groups.filter((group) => group.id !== groupId))
  }

  const handleDragStart = (e: React.DragEvent, connectionId: string) => {
    e.dataTransfer.setData("text/plain", connectionId)
  }

  const handleDrop = (e: React.DragEvent, groupId: string) => {
    e.preventDefault()
    const connectionId = e.dataTransfer.getData("text/plain")

    // Remove from other groups first
    const updatedGroups = groups.map((group) => ({
      ...group,
      connectionIds: group.connectionIds.filter((id) => id !== connectionId),
    }))

    // Add to target group
    const targetGroupIndex = updatedGroups.findIndex((g) => g.id === groupId)
    if (targetGroupIndex !== -1) {
      updatedGroups[targetGroupIndex].connectionIds.push(connectionId)
    }

    onUpdateGroups(updatedGroups)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className="space-y-2">
      {/* Add Group Button */}
      <div className="px-2">
        {showAddGroup ? (
          <div className="flex gap-2">
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group name"
              className="h-8"
              onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
              autoFocus
            />
            <Button size="sm" onClick={handleCreateGroup}>
              Add
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAddGroup(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddGroup(true)}
            className="w-full justify-start gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Group
          </Button>
        )}
      </div>

      {/* Groups */}
      {groups.map((group) => (
        <div key={group.id} className="px-2">
          <div
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
            onDrop={(e) => handleDrop(e, group.id)}
            onDragOver={handleDragOver}
          >
            <Button size="sm" variant="ghost" onClick={() => handleToggleGroup(group.id)} className="h-6 w-6 p-0">
              {group.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>

            {group.isExpanded ? (
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Folder className="h-4 w-4 text-muted-foreground" />
            )}

            {editingGroup === group.id ? (
              <Input
                defaultValue={group.name}
                className="h-6 text-sm"
                onBlur={(e) => handleRenameGroup(group.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRenameGroup(group.id, e.currentTarget.value)
                  }
                }}
                autoFocus
              />
            ) : (
              <span className="flex-1 text-sm font-medium" onDoubleClick={() => setEditingGroup(group.id)}>
                {group.name}
              </span>
            )}

            <Badge variant="outline" className={cn("text-xs", group.color)}>
              {group.connectionIds.length}
            </Badge>

            <Button size="sm" variant="ghost" onClick={() => setEditingGroup(group.id)} className="h-6 w-6 p-0">
              <Edit2 className="h-3 w-3" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteGroup(group.id)}
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          {/* Group Connections */}
          {group.isExpanded && (
            <div className="ml-6 space-y-1">
              {group.connectionIds.map((connectionId) => {
                const connection = connections.find((c) => c.id === connectionId)
                if (!connection) return null

                return (
                  <Card
                    key={connectionId}
                    className={cn(
                      "p-2 cursor-pointer transition-colors hover:bg-muted/50",
                      activeConnection === connectionId && "bg-accent/20 border-accent/30",
                    )}
                    onClick={() => onSelectConnection(connectionId)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, connectionId)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          connection.status === "connected" && "bg-accent",
                          connection.status === "connecting" && "bg-muted-foreground animate-pulse",
                          connection.status === "disconnected" && "bg-destructive",
                        )}
                      />
                      <span className="text-sm font-medium">{connection.name}</span>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      ))}

      {/* Ungrouped Connections */}
      {ungroupedConnections.length > 0 && (
        <div className="px-2">
          <div className="text-xs text-muted-foreground mb-2 px-2">Ungrouped</div>
          <div className="space-y-1">
            {ungroupedConnections.map((connection) => (
              <Card
                key={connection.id}
                className={cn(
                  "p-2 cursor-pointer transition-colors hover:bg-muted/50",
                  activeConnection === connection.id && "bg-accent/20 border-accent/30",
                )}
                onClick={() => onSelectConnection(connection.id)}
                draggable
                onDragStart={(e) => handleDragStart(e, connection.id)}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      connection.status === "connected" && "bg-accent",
                      connection.status === "connecting" && "bg-muted-foreground animate-pulse",
                      connection.status === "disconnected" && "bg-destructive",
                    )}
                  />
                  <span className="text-sm font-medium">{connection.name}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
