"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Star, Plus, X, Copy, Play } from "lucide-react"

interface CommandFavorite {
  id: string
  name: string
  command: string
  description?: string
  category?: string
}

interface CommandFavoritesProps {
  isOpen: boolean
  onClose: () => void
  onExecuteCommand: (command: string) => void
}

export function CommandFavorites({ isOpen, onClose, onExecuteCommand }: CommandFavoritesProps) {
  const [favorites, setFavorites] = useState<CommandFavorite[]>([
    {
      id: "1",
      name: "System Info",
      command: "uname -a && cat /etc/os-release",
      description: "Display system information",
      category: "System",
    },
    {
      id: "2",
      name: "Disk Usage",
      command: "df -h",
      description: "Show disk space usage",
      category: "System",
    },
    {
      id: "3",
      name: "Process Monitor",
      command: "top -n 1",
      description: "Show running processes",
      category: "Monitoring",
    },
    {
      id: "4",
      name: "Network Status",
      command: "netstat -tuln",
      description: "Show network connections",
      category: "Network",
    },
  ])

  const [newCommand, setNewCommand] = useState({ name: "", command: "", description: "" })
  const [showAddForm, setShowAddForm] = useState(false)

  const handleAddFavorite = () => {
    if (newCommand.name && newCommand.command) {
      const favorite: CommandFavorite = {
        id: Date.now().toString(),
        ...newCommand,
        category: "Custom",
      }
      setFavorites((prev) => [...prev, favorite])
      setNewCommand({ name: "", command: "", description: "" })
      setShowAddForm(false)
    }
  }

  const handleDeleteFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id))
  }

  const copyToClipboard = (command: string) => {
    navigator.clipboard.writeText(command)
  }

  if (!isOpen) return null

  return (
    <div className="absolute top-2 left-2 bg-card border border-border rounded-lg shadow-lg z-10 w-96 max-h-96">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-accent" />
          <span className="font-medium">Command Favorites</span>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setShowAddForm(!showAddForm)} className="h-8 w-8 p-0">
            <Plus className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="max-h-80">
        <div className="p-3 space-y-2">
          {showAddForm && (
            <Card className="p-3 space-y-2 border-dashed">
              <Input
                placeholder="Command name"
                value={newCommand.name}
                onChange={(e) => setNewCommand((prev) => ({ ...prev, name: e.target.value }))}
              />
              <Input
                placeholder="Command"
                value={newCommand.command}
                onChange={(e) => setNewCommand((prev) => ({ ...prev, command: e.target.value }))}
              />
              <Input
                placeholder="Description (optional)"
                value={newCommand.description}
                onChange={(e) => setNewCommand((prev) => ({ ...prev, description: e.target.value }))}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddFavorite}>
                  Add
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          {favorites.map((favorite) => (
            <Card key={favorite.id} className="p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium text-sm">{favorite.name}</div>
                  {favorite.description && <div className="text-xs text-muted-foreground">{favorite.description}</div>}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(favorite.command)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onExecuteCommand(favorite.command)}
                    className="h-6 w-6 p-0"
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteFavorite(favorite.id)}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="text-xs font-mono bg-muted p-2 rounded">{favorite.command}</div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
