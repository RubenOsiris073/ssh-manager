"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { History, Search, Copy, Play, Star, Clock, Server, Download } from "lucide-react"
import { cn } from "@/lib/utils"

interface CommandHistoryEntry {
  id: string
  command: string
  timestamp: Date
  connectionId: string
  connectionName: string
  exitCode: number
  duration: number
  output?: string
}

interface CommandHistoryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connections: Array<{ id: string; name: string }>
  onExecuteCommand: (command: string) => void
}

export function CommandHistory({ open, onOpenChange, connections, onExecuteCommand }: CommandHistoryProps) {
  const [history, setHistory] = useState<CommandHistoryEntry[]>([
    {
      id: "1",
      command: "ps aux | grep node",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      connectionId: "1",
      connectionName: "Production Server",
      exitCode: 0,
      duration: 120,
      output: "root 1234 0.5 2.1 node server.js",
    },
    {
      id: "2",
      command: "df -h",
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
      connectionId: "1",
      connectionName: "Production Server",
      exitCode: 0,
      duration: 85,
    },
    {
      id: "3",
      command: "systemctl status nginx",
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      connectionId: "2",
      connectionName: "Development Server",
      exitCode: 0,
      duration: 200,
    },
    {
      id: "4",
      command: "tail -f /var/log/nginx/error.log",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      connectionId: "1",
      connectionName: "Production Server",
      exitCode: 1,
      duration: 5000,
    },
    {
      id: "5",
      command: "docker ps -a",
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      connectionId: "2",
      connectionName: "Development Server",
      exitCode: 0,
      duration: 150,
    },
  ])

  const [filteredHistory, setFilteredHistory] = useState<CommandHistoryEntry[]>(history)
  const [searchTerm, setSearchTerm] = useState("")
  const [connectionFilter, setConnectionFilter] = useState<string>("all")
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  // Filter history based on search and connection
  useEffect(() => {
    let filtered = history

    if (searchTerm) {
      filtered = filtered.filter(
        (entry) =>
          entry.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.connectionName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (connectionFilter !== "all") {
      filtered = filtered.filter((entry) => entry.connectionId === connectionFilter)
    }

    // Sort by timestamp (most recent first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    setFilteredHistory(filtered)
  }, [history, searchTerm, connectionFilter])

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command)
  }

  const toggleFavorite = (commandId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(commandId)) {
        newFavorites.delete(commandId)
      } else {
        newFavorites.add(commandId)
      }
      return newFavorites
    })
  }

  const exportHistory = () => {
    const historyData = filteredHistory.map((entry) => ({
      command: entry.command,
      timestamp: entry.timestamp.toISOString(),
      connection: entry.connectionName,
      exitCode: entry.exitCode,
      duration: entry.duration,
    }))

    const dataStr = JSON.stringify(historyData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `command-history-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const getCommandFrequency = () => {
    const frequency: Record<string, number> = {}
    history.forEach((entry) => {
      const baseCommand = entry.command.split(" ")[0]
      frequency[baseCommand] = (frequency[baseCommand] || 0) + 1
    })
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
  }

  const mostUsedCommands = getCommandFrequency()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Command History
            <Badge variant="outline" className="ml-auto">
              {filteredHistory.length} commands
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search command history..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={connectionFilter}
              onChange={(e) => setConnectionFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">All Connections</option>
              {connections.map((conn) => (
                <option key={conn.id} value={conn.id}>
                  {conn.name}
                </option>
              ))}
            </select>

            <Button variant="outline" onClick={exportHistory}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Most Used Commands */}
          <Card className="p-3">
            <h3 className="text-sm font-medium mb-2">Most Used Commands</h3>
            <div className="flex gap-2 flex-wrap">
              {mostUsedCommands.map(([command, count]) => (
                <Badge key={command} variant="outline" className="text-xs">
                  {command} ({count})
                </Badge>
              ))}
            </div>
          </Card>

          {/* History List */}
          <ScrollArea className="max-h-96">
            <div className="space-y-2">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No commands match your search</p>
                </div>
              ) : (
                filteredHistory.map((entry) => (
                  <Card key={entry.id} className="p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono flex-1 min-w-0 truncate">
                            {entry.command}
                          </code>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              entry.exitCode === 0
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : "bg-red-500/20 text-red-400 border-red-500/30",
                            )}
                          >
                            {entry.exitCode === 0 ? "Success" : "Failed"}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {entry.timestamp.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Server className="h-3 w-3" />
                            {entry.connectionName}
                          </div>
                          <div>Duration: {entry.duration}ms</div>
                        </div>

                        {entry.output && (
                          <div className="mt-2 text-xs bg-muted/50 p-2 rounded font-mono">{entry.output}</div>
                        )}
                      </div>

                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleFavorite(entry.id)}
                          className={cn("h-8 w-8 p-0", favorites.has(entry.id) && "text-yellow-400")}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyCommand(entry.command)}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            onExecuteCommand(entry.command)
                            onOpenChange(false)
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
