"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, Upload, FileText, AlertTriangle, CheckCircle, Copy, Eye } from "lucide-react"
import type { SSHConnection } from "./ssh-manager"

interface ConnectionGroup {
  id: string
  name: string
  color: string
  isExpanded: boolean
  connectionIds: string[]
}

interface ExportData {
  connections: SSHConnection[]
  groups: ConnectionGroup[]
  settings: Record<string, any>
  exportDate: string
  version: string
}

interface ImportExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connections: SSHConnection[]
  groups: ConnectionGroup[]
  onImportConnections: (connections: SSHConnection[]) => void
  onImportGroups: (groups: ConnectionGroup[]) => void
}

export function ImportExportModal({
  open,
  onOpenChange,
  connections,
  groups,
  onImportConnections,
  onImportGroups,
}: ImportExportModalProps) {
  const [exportOptions, setExportOptions] = useState({
    includeConnections: true,
    includeGroups: true,
    includeSettings: true,
    includePasswords: false,
    format: "json" as "json" | "csv",
  })

  const [importData, setImportData] = useState("")
  const [importPreview, setImportPreview] = useState<ExportData | null>(null)
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)

  const handleExport = () => {
    const exportData: ExportData = {
      connections: exportOptions.includeConnections
        ? connections.map((conn) => ({
            ...conn,
            // Remove sensitive data if not including passwords
            password: exportOptions.includePasswords ? conn.password : undefined,
          }))
        : [],
      groups: exportOptions.includeGroups ? groups : [],
      settings: exportOptions.includeSettings
        ? {
            theme: "dark",
            fontSize: 14,
            autoConnect: false,
          }
        : {},
      exportDate: new Date().toISOString(),
      version: "1.0",
    }

    if (exportOptions.format === "json") {
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `ssh-manager-export-${new Date().toISOString().split("T")[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    } else {
      // CSV export for connections only
      const csvHeaders = ["Name", "Host", "Port", "Username", "Status", "Last Connected"]
      const csvRows = connections.map((conn) => [
        conn.name,
        conn.host,
        conn.port.toString(),
        conn.username,
        conn.status,
        conn.lastConnected?.toISOString() || "",
      ])

      const csvContent = [csvHeaders, ...csvRows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

      const dataBlob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `ssh-connections-${new Date().toISOString().split("T")[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleImportPreview = () => {
    try {
      const parsed = JSON.parse(importData) as ExportData

      // Validate structure
      const errors: string[] = []

      if (!parsed.connections && !parsed.groups) {
        errors.push("No valid connections or groups found in import data")
      }

      if (parsed.connections) {
        parsed.connections.forEach((conn, index) => {
          if (!conn.name || !conn.host || !conn.username) {
            errors.push(`Connection ${index + 1}: Missing required fields (name, host, username)`)
          }
        })
      }

      if (parsed.groups) {
        parsed.groups.forEach((group, index) => {
          if (!group.name || !group.id) {
            errors.push(`Group ${index + 1}: Missing required fields (name, id)`)
          }
        })
      }

      setImportErrors(errors)
      setImportPreview(parsed)
      setShowPreview(true)
    } catch (error) {
      setImportErrors(["Invalid JSON format. Please check your import data."])
      setImportPreview(null)
      setShowPreview(true)
    }
  }

  const handleConfirmImport = () => {
    if (!importPreview || importErrors.length > 0) return

    if (importPreview.connections) {
      const newConnections = importPreview.connections.map((conn) => ({
        ...conn,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        status: "disconnected" as const,
      }))
      onImportConnections(newConnections)
    }

    if (importPreview.groups) {
      const newGroups = importPreview.groups.map((group) => ({
        ...group,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        connectionIds: [], // Reset connection IDs as they will be different
      }))
      onImportGroups(newGroups)
    }

    setImportData("")
    setImportPreview(null)
    setShowPreview(false)
    onOpenChange(false)
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setImportData(content)
      }
      reader.readAsText(file)
    }
  }

  const copyExportData = () => {
    const exportData: ExportData = {
      connections: exportOptions.includeConnections ? connections : [],
      groups: exportOptions.includeGroups ? groups : [],
      settings: exportOptions.includeSettings ? { theme: "dark" } : {},
      exportDate: new Date().toISOString(),
      version: "1.0",
    }

    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import / Export Connections
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="export" className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          <div className="mt-4 max-h-96 overflow-y-auto">
            <TabsContent value="export" className="space-y-4">
              <Card className="p-4">
                <h3 className="font-medium mb-3">Export Options</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Include Connections</Label>
                      <p className="text-sm text-muted-foreground">Export all connection configurations</p>
                    </div>
                    <Switch
                      checked={exportOptions.includeConnections}
                      onCheckedChange={(checked) =>
                        setExportOptions((prev) => ({ ...prev, includeConnections: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Include Groups</Label>
                      <p className="text-sm text-muted-foreground">Export connection groups and organization</p>
                    </div>
                    <Switch
                      checked={exportOptions.includeGroups}
                      onCheckedChange={(checked) => setExportOptions((prev) => ({ ...prev, includeGroups: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Include Settings</Label>
                      <p className="text-sm text-muted-foreground">Export application preferences and configuration</p>
                    </div>
                    <Switch
                      checked={exportOptions.includeSettings}
                      onCheckedChange={(checked) => setExportOptions((prev) => ({ ...prev, includeSettings: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="flex items-center gap-2">
                        Include Passwords
                        <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Include saved passwords (not recommended for sharing)
                      </p>
                    </div>
                    <Switch
                      checked={exportOptions.includePasswords}
                      onCheckedChange={(checked) =>
                        setExportOptions((prev) => ({ ...prev, includePasswords: checked }))
                      }
                    />
                  </div>

                  <div>
                    <Label>Export Format</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant={exportOptions.format === "json" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setExportOptions((prev) => ({ ...prev, format: "json" }))}
                      >
                        JSON (Full)
                      </Button>
                      <Button
                        variant={exportOptions.format === "csv" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setExportOptions((prev) => ({ ...prev, format: "csv" }))}
                      >
                        CSV (Connections Only)
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-3">Export Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Connections</div>
                    <div className="font-mono">{exportOptions.includeConnections ? connections.length : 0}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Groups</div>
                    <div className="font-mono">{exportOptions.includeGroups ? groups.length : 0}</div>
                  </div>
                </div>
              </Card>

              <div className="flex gap-2">
                <Button onClick={handleExport} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Export to File
                </Button>
                <Button variant="outline" onClick={copyExportData}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="import" className="space-y-4">
              <Card className="p-4">
                <h3 className="font-medium mb-3">Import Data</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Import from File</Label>
                    <div className="mt-2">
                      <Button variant="outline" asChild>
                        <label>
                          <Upload className="h-4 w-4 mr-2" />
                          Choose File
                          <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
                        </label>
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Or Paste JSON Data</Label>
                    <Textarea
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      placeholder="Paste your exported JSON data here..."
                      className="mt-2 h-32 font-mono text-sm"
                    />
                  </div>

                  <Button onClick={handleImportPreview} disabled={!importData.trim()} className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Import
                  </Button>
                </div>
              </Card>

              {showPreview && (
                <Card className="p-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    Import Preview
                    {importErrors.length === 0 ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    )}
                  </h3>

                  {importErrors.length > 0 && (
                    <div className="mb-4 p-3 bg-destructive/20 border border-destructive/30 rounded">
                      <div className="font-medium text-destructive mb-2">Import Errors:</div>
                      <ul className="text-sm text-destructive space-y-1">
                        {importErrors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {importPreview && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Connections</div>
                          <div className="font-mono">{importPreview.connections?.length || 0}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Groups</div>
                          <div className="font-mono">{importPreview.groups?.length || 0}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Export Date</div>
                          <div className="font-mono text-xs">
                            {importPreview.exportDate
                              ? new Date(importPreview.exportDate).toLocaleDateString()
                              : "Unknown"}
                          </div>
                        </div>
                      </div>

                      {importPreview.connections && importPreview.connections.length > 0 && (
                        <div>
                          <div className="text-sm font-medium mb-2">Connections to Import:</div>
                          <ScrollArea className="h-32 border rounded p-2">
                            <div className="space-y-1">
                              {importPreview.connections.map((conn, index) => (
                                <div key={index} className="flex items-center justify-between text-xs">
                                  <span>{conn.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {conn.username}@{conn.host}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}

                      <Button onClick={handleConfirmImport} disabled={importErrors.length > 0} className="w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        Confirm Import
                      </Button>
                    </div>
                  )}
                </Card>
              )}
            </TabsContent>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
