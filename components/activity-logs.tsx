"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  FileText,
  Filter,
  Download,
  Search,
  Calendar,
  Clock,
  Server,
  Terminal,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ActivityLog {
  id: string
  timestamp: Date
  type: "connection" | "command" | "error" | "system"
  level: "info" | "warning" | "error" | "success"
  connectionId?: string
  connectionName?: string
  message: string
  details?: string
  duration?: number
}

interface ActivityLogsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connections: Array<{ id: string; name: string }>
}

export function ActivityLogs({ open, onOpenChange, connections }: ActivityLogsProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([
    {
      id: "1",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      type: "connection",
      level: "success",
      connectionId: "1",
      connectionName: "Production Server",
      message: "Successfully connected to Production Server",
      duration: 1200,
    },
    {
      id: "2",
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
      type: "command",
      level: "info",
      connectionId: "1",
      connectionName: "Production Server",
      message: "Executed command: ps aux",
      details: "Command completed successfully",
    },
    {
      id: "3",
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      type: "error",
      level: "error",
      connectionId: "2",
      connectionName: "Development Server",
      message: "Connection failed: Connection timeout",
      details: "Failed to connect to dev.example.com:2222 after 30 seconds",
    },
    {
      id: "4",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      type: "system",
      level: "info",
      message: "SSH Manager started",
      details: "Application initialized successfully",
    },
    {
      id: "5",
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      type: "connection",
      level: "warning",
      connectionId: "1",
      connectionName: "Production Server",
      message: "Connection interrupted",
      details: "Network connection lost, attempting to reconnect...",
    },
  ])

  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>(logs)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [levelFilter, setLevelFilter] = useState<string>("all")
  const [connectionFilter, setConnectionFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")

  // Simulate real-time log updates
  useEffect(() => {
    const interval = setInterval(() => {
      const logTypes = ["connection", "command", "error", "system"] as const
      const logLevels = ["info", "warning", "error", "success"] as const
      const messages = [
        "Command executed successfully",
        "Connection established",
        "Authentication successful",
        "Session timeout warning",
        "Resource usage alert",
        "Backup completed",
        "Configuration updated",
      ]

      const newLog: ActivityLog = {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: logTypes[Math.floor(Math.random() * logTypes.length)],
        level: logLevels[Math.floor(Math.random() * logLevels.length)],
        connectionId: connections[Math.floor(Math.random() * connections.length)]?.id,
        connectionName: connections[Math.floor(Math.random() * connections.length)]?.name,
        message: messages[Math.floor(Math.random() * messages.length)],
        details: "Automated log entry for demonstration",
      }

      setLogs((prev) => [newLog, ...prev.slice(0, 99)]) // Keep last 100 logs
    }, 10000) // Add new log every 10 seconds

    return () => clearInterval(interval)
  }, [connections])

  // Filter logs based on search and filters
  useEffect(() => {
    let filtered = logs

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.connectionName?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((log) => log.type === typeFilter)
    }

    // Level filter
    if (levelFilter !== "all") {
      filtered = filtered.filter((log) => log.level === levelFilter)
    }

    // Connection filter
    if (connectionFilter !== "all") {
      filtered = filtered.filter((log) => log.connectionId === connectionFilter)
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case "1h":
          filterDate.setHours(now.getHours() - 1)
          break
        case "24h":
          filterDate.setDate(now.getDate() - 1)
          break
        case "7d":
          filterDate.setDate(now.getDate() - 7)
          break
        case "30d":
          filterDate.setDate(now.getDate() - 30)
          break
      }

      if (dateFilter !== "all") {
        filtered = filtered.filter((log) => log.timestamp >= filterDate)
      }
    }

    setFilteredLogs(filtered)
  }, [logs, searchTerm, typeFilter, levelFilter, connectionFilter, dateFilter])

  const getLogIcon = (type: ActivityLog["type"], level: ActivityLog["level"]) => {
    switch (level) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-400" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-400" />
      default:
        switch (type) {
          case "connection":
            return <Server className="h-4 w-4 text-blue-400" />
          case "command":
            return <Terminal className="h-4 w-4 text-purple-400" />
          default:
            return <Info className="h-4 w-4 text-muted-foreground" />
        }
    }
  }

  const getLevelBadge = (level: ActivityLog["level"]) => {
    const variants = {
      success: "bg-green-500/20 text-green-400 border-green-500/30",
      error: "bg-red-500/20 text-red-400 border-red-500/30",
      warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    }

    return (
      <Badge variant="outline" className={cn("text-xs", variants[level])}>
        {level}
      </Badge>
    )
  }

  const exportLogs = () => {
    const logData = filteredLogs.map((log) => ({
      timestamp: log.timestamp.toISOString(),
      type: log.type,
      level: log.level,
      connection: log.connectionName || "System",
      message: log.message,
      details: log.details,
    }))

    const dataStr = JSON.stringify(logData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `ssh-manager-logs-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setTypeFilter("all")
    setLevelFilter("all")
    setConnectionFilter("all")
    setDateFilter("all")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Activity Logs
            <Badge variant="outline" className="ml-auto">
              {filteredLogs.length} entries
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-48">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="connection">Connection</SelectItem>
                <SelectItem value="command">Command</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>

            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>

            <Select value={connectionFilter} onValueChange={setConnectionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Connection" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Connections</SelectItem>
                {connections.map((conn) => (
                  <SelectItem key={conn.id} value={conn.id}>
                    {conn.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={clearFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Clear
            </Button>

            <Button variant="outline" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Logs List */}
        <ScrollArea className="flex-1 max-h-96">
          <div className="space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No logs match your current filters</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <Card key={log.id} className="p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">{getLogIcon(log.type, log.level)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{log.message}</span>
                        {getLevelBadge(log.level)}
                        <Badge variant="outline" className="text-xs">
                          {log.type}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {log.timestamp.toLocaleString()}
                        </div>
                        {log.connectionName && (
                          <div className="flex items-center gap-1">
                            <Server className="h-3 w-3" />
                            {log.connectionName}
                          </div>
                        )}
                        {log.duration && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {log.duration}ms
                          </div>
                        )}
                      </div>

                      {log.details && (
                        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded mt-2">{log.details}</div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
