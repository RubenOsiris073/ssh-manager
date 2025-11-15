"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Cpu, MemoryStick, HardDrive, Network, Activity, RefreshCw, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface ResourceData {
  cpu: {
    usage: number
    cores: number
    temperature?: number
    processes: Array<{ name: string; cpu: number; pid: number }>
  }
  memory: {
    used: number
    total: number
    available: number
    swap: { used: number; total: number }
  }
  disk: {
    used: number
    total: number
    readSpeed: number
    writeSpeed: number
  }
  network: {
    downloadSpeed: number
    uploadSpeed: number
    totalDownload: number
    totalUpload: number
  }
  uptime: number
  loadAverage: [number, number, number]
}

interface ResourceMonitorProps {
  connectionId: string
  isVisible: boolean
}

export function ResourceMonitor({ connectionId, isVisible }: ResourceMonitorProps) {
  const [resourceData, setResourceData] = useState<ResourceData>({
    cpu: {
      usage: 45,
      cores: 8,
      temperature: 65,
      processes: [
        { name: "node", cpu: 12.5, pid: 1234 },
        { name: "nginx", cpu: 8.2, pid: 5678 },
        { name: "postgres", cpu: 6.1, pid: 9012 },
        { name: "redis", cpu: 3.4, pid: 3456 },
      ],
    },
    memory: {
      used: 6.2,
      total: 16,
      available: 9.8,
      swap: { used: 0.5, total: 4 },
    },
    disk: {
      used: 120,
      total: 500,
      readSpeed: 45.2,
      writeSpeed: 23.1,
    },
    network: {
      downloadSpeed: 1.2,
      uploadSpeed: 0.8,
      totalDownload: 1024,
      totalUpload: 512,
    },
    uptime: 86400 * 7 + 3600 * 4 + 60 * 23,
    loadAverage: [1.2, 1.5, 1.8],
  })

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [history, setHistory] = useState<Array<{ timestamp: Date; cpu: number; memory: number }>>([])

  // Simulate real-time data updates
  useEffect(() => {
    if (!isVisible) return

    const interval = setInterval(() => {
      setResourceData((prev) => ({
        ...prev,
        cpu: {
          ...prev.cpu,
          usage: Math.max(10, Math.min(90, prev.cpu.usage + (Math.random() - 0.5) * 10)),
          temperature: Math.max(40, Math.min(80, prev.cpu.temperature! + (Math.random() - 0.5) * 5)),
        },
        memory: {
          ...prev.memory,
          used: Math.max(2, Math.min(14, prev.memory.used + (Math.random() - 0.5) * 0.5)),
        },
        disk: {
          ...prev.disk,
          readSpeed: Math.max(0, prev.disk.readSpeed + (Math.random() - 0.5) * 20),
          writeSpeed: Math.max(0, prev.disk.writeSpeed + (Math.random() - 0.5) * 15),
        },
        network: {
          ...prev.network,
          downloadSpeed: Math.max(0, prev.network.downloadSpeed + (Math.random() - 0.5) * 2),
          uploadSpeed: Math.max(0, prev.network.uploadSpeed + (Math.random() - 0.5) * 1.5),
        },
      }))

      // Update history
      setHistory((prev) => {
        const newEntry = {
          timestamp: new Date(),
          cpu: resourceData.cpu.usage,
          memory: (resourceData.memory.used / resourceData.memory.total) * 100,
        }
        return [...prev.slice(-19), newEntry] // Keep last 20 entries
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [isVisible, resourceData.cpu.usage, resourceData.memory.used, resourceData.memory.total])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  const formatBytes = (bytes: number) => {
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    if (bytes === 0) return "0 B"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const getUsageColor = (percentage: number) => {
    if (percentage < 50) return "text-green-400"
    if (percentage < 80) return "text-yellow-400"
    return "text-red-400"
  }

  const getUsageBgColor = (percentage: number) => {
    if (percentage < 50) return "bg-green-500"
    if (percentage < 80) return "bg-yellow-500"
    return "bg-red-500"
  }

  if (!isVisible) return null

  const memoryUsagePercent = (resourceData.memory.used / resourceData.memory.total) * 100
  const diskUsagePercent = (resourceData.disk.used / resourceData.disk.total) * 100
  const swapUsagePercent = (resourceData.memory.swap.used / resourceData.memory.swap.total) * 100

  return (
    <div className="absolute top-2 right-2 w-96 max-h-[80vh] bg-card border border-border rounded-lg shadow-lg z-10">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent" />
          <span className="font-medium">Resource Monitor</span>
        </div>
        <Button size="sm" variant="ghost" onClick={handleRefresh} disabled={isRefreshing} className="h-8 w-8 p-0">
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
        </Button>
      </div>

      <ScrollArea className="max-h-96">
        <div className="p-3 space-y-4">
          {/* System Overview */}
          <Card className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">System Overview</span>
              <Badge variant="outline" className="text-xs">
                Uptime: {formatUptime(resourceData.uptime)}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="text-muted-foreground">Load Avg</div>
                <div className="font-mono">{resourceData.loadAverage.join(", ")}</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">Cores</div>
                <div className="font-mono">{resourceData.cpu.cores}</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">Temp</div>
                <div className="font-mono">{resourceData.cpu.temperature}°C</div>
              </div>
            </div>
          </Card>

          {/* CPU Usage */}
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium">CPU Usage</span>
              <span className={cn("text-sm font-mono ml-auto", getUsageColor(resourceData.cpu.usage))}>
                {resourceData.cpu.usage.toFixed(1)}%
              </span>
            </div>
            <Progress value={resourceData.cpu.usage} className="h-2 mb-2" />
            <div className="space-y-1">
              {resourceData.cpu.processes.slice(0, 3).map((process) => (
                <div key={process.pid} className="flex justify-between text-xs">
                  <span className="font-mono">{process.name}</span>
                  <span className="text-muted-foreground">{process.cpu}%</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Memory Usage */}
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <MemoryStick className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium">Memory</span>
              <span className={cn("text-sm font-mono ml-auto", getUsageColor(memoryUsagePercent))}>
                {memoryUsagePercent.toFixed(1)}%
              </span>
            </div>
            <Progress value={memoryUsagePercent} className="h-2 mb-2" />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground">Used</div>
                <div className="font-mono">{resourceData.memory.used.toFixed(1)} GB</div>
              </div>
              <div>
                <div className="text-muted-foreground">Available</div>
                <div className="font-mono">{resourceData.memory.available.toFixed(1)} GB</div>
              </div>
            </div>

            {/* Swap */}
            <div className="mt-2 pt-2 border-t border-border">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground">Swap</span>
                <span className="text-xs font-mono">{swapUsagePercent.toFixed(1)}%</span>
              </div>
              <Progress value={swapUsagePercent} className="h-1" />
            </div>
          </Card>

          {/* Disk Usage */}
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium">Disk</span>
              <span className={cn("text-sm font-mono ml-auto", getUsageColor(diskUsagePercent))}>
                {diskUsagePercent.toFixed(1)}%
              </span>
            </div>
            <Progress value={diskUsagePercent} className="h-2 mb-2" />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground">Used</div>
                <div className="font-mono">{resourceData.disk.used} GB</div>
              </div>
              <div>
                <div className="text-muted-foreground">Free</div>
                <div className="font-mono">{resourceData.disk.total - resourceData.disk.used} GB</div>
              </div>
            </div>

            {/* I/O Speed */}
            <div className="mt-2 pt-2 border-t border-border">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  <span className="text-muted-foreground">Read</span>
                  <span className="font-mono ml-auto">{resourceData.disk.readSpeed.toFixed(1)} MB/s</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-red-400" />
                  <span className="text-muted-foreground">Write</span>
                  <span className="font-mono ml-auto">{resourceData.disk.writeSpeed.toFixed(1)} MB/s</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Network Usage */}
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Network className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-medium">Network</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
              <div className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-blue-400" />
                <span className="text-muted-foreground">Download</span>
                <span className="font-mono ml-auto">{resourceData.network.downloadSpeed.toFixed(1)} MB/s</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-400" />
                <span className="text-muted-foreground">Upload</span>
                <span className="font-mono ml-auto">{resourceData.network.uploadSpeed.toFixed(1)} MB/s</span>
              </div>
            </div>

            {/* Total Transfer */}
            <div className="pt-2 border-t border-border">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground">Total Down</div>
                  <div className="font-mono">{formatBytes(resourceData.network.totalDownload * 1024 * 1024)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total Up</div>
                  <div className="font-mono">{formatBytes(resourceData.network.totalUpload * 1024 * 1024)}</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Mini Chart */}
          <Card className="p-3">
            <div className="text-sm font-medium mb-2">Usage History</div>
            <div className="h-16 flex items-end gap-1">
              {history.map((entry, index) => (
                <div key={index} className="flex-1 flex flex-col gap-1">
                  <div
                    className="bg-blue-500 rounded-sm min-h-[2px]"
                    style={{ height: `${(entry.cpu / 100) * 100}%` }}
                    title={`CPU: ${entry.cpu.toFixed(1)}%`}
                  />
                  <div
                    className="bg-green-500 rounded-sm min-h-[2px]"
                    style={{ height: `${(entry.memory / 100) * 100}%` }}
                    title={`Memory: ${entry.memory.toFixed(1)}%`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>CPU</span>
              <span>Memory</span>
            </div>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}
