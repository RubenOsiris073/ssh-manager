"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Settings, Palette, Terminal, Key, Download, Upload } from "lucide-react"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface AppSettings {
  theme: "dark" | "light" | "system" | "ocean" | "forest" | "sunset" | "cyberpunk" | "minimal"
  fontSize: number
  fontFamily: string
  autoConnect: boolean
  savePasswords: boolean
  confirmDelete: boolean
  terminalCursor: "block" | "line" | "underline"
  scrollback: number
}

const colorThemes = {
  dark: { name: "Dark", colors: "bg-gray-900 text-gray-100" },
  light: { name: "Light", colors: "bg-white text-gray-900" },
  system: { name: "System", colors: "bg-background text-foreground" },
  ocean: { name: "Ocean Blue", colors: "bg-slate-900 text-blue-100 border-blue-500/20" },
  forest: { name: "Forest Green", colors: "bg-emerald-950 text-emerald-100 border-emerald-500/20" },
  sunset: { name: "Sunset Orange", colors: "bg-orange-950 text-orange-100 border-orange-500/20" },
  cyberpunk: { name: "Cyberpunk Purple", colors: "bg-purple-950 text-purple-100 border-purple-500/20" },
  minimal: { name: "Minimal Gray", colors: "bg-neutral-900 text-neutral-100 border-neutral-500/20" },
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [settings, setSettings] = useState<AppSettings>({
    theme: "dark",
    fontSize: 14,
    fontFamily: "JetBrains Mono",
    autoConnect: false,
    savePasswords: true,
    confirmDelete: true,
    terminalCursor: "block",
    scrollback: 1000,
  })

  const handleSettingChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))

    if (key === "theme" && value !== "system") {
      applyTheme(value as string)
    }
  }

  const applyTheme = (theme: string) => {
    const root = document.documentElement

    // Remove existing theme classes
    root.classList.remove("theme-ocean", "theme-forest", "theme-sunset", "theme-cyberpunk", "theme-minimal")

    // Apply new theme class
    if (theme !== "dark" && theme !== "light" && theme !== "system") {
      root.classList.add(`theme-${theme}`)
    }
  }

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "ssh-manager-settings.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string)
          setSettings(importedSettings)
        } catch (error) {
          console.error("Failed to import settings:", error)
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="terminal">Terminal</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <div className="mt-4 max-h-96 overflow-y-auto">
            <TabsContent value="general" className="space-y-4">
              <Card className="p-4">
                <h3 className="font-medium mb-3">Connection Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-connect on startup</Label>
                      <p className="text-sm text-muted-foreground">Automatically connect to last active connection</p>
                    </div>
                    <Switch
                      checked={settings.autoConnect}
                      onCheckedChange={(checked) => handleSettingChange("autoConnect", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Confirm before deleting</Label>
                      <p className="text-sm text-muted-foreground">
                        Show confirmation dialog when deleting connections
                      </p>
                    </div>
                    <Switch
                      checked={settings.confirmDelete}
                      onCheckedChange={(checked) => handleSettingChange("confirmDelete", checked)}
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-3">Import/Export</h3>
                <div className="flex gap-2">
                  <Button onClick={handleExportSettings} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export Settings
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent" asChild>
                    <label>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Settings
                      <input type="file" accept=".json" onChange={handleImportSettings} className="hidden" />
                    </label>
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <Card className="p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Theme
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>Color Theme</Label>
                    <Select
                      value={settings.theme}
                      onValueChange={(value: AppSettings["theme"]) => handleSettingChange("theme", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(colorThemes).map(([key, theme]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full ${theme.colors.split(" ")[0]} border`} />
                              {theme.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Theme Preview</Label>
                    <div className={`mt-2 p-4 rounded-lg border ${colorThemes[settings.theme].colors}`}>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Terminal Preview</div>
                        <div className="font-mono text-xs">
                          <div>$ ssh user@server.com</div>
                          <div className="text-green-400">Connected to server.com</div>
                          <div>$ ls -la</div>
                          <div>drwxr-xr-x 5 user user 4096 Dec 10 15:30 .</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="terminal" className="space-y-4">
              <Card className="p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  Terminal Appearance
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>Font Size</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="10"
                        max="24"
                        value={settings.fontSize}
                        onChange={(e) => handleSettingChange("fontSize", Number.parseInt(e.target.value))}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">px</span>
                    </div>
                  </div>

                  <div>
                    <Label>Font Family</Label>
                    <Select
                      value={settings.fontFamily}
                      onValueChange={(value) => handleSettingChange("fontFamily", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="JetBrains Mono">JetBrains Mono</SelectItem>
                        <SelectItem value="Fira Code">Fira Code</SelectItem>
                        <SelectItem value="Source Code Pro">Source Code Pro</SelectItem>
                        <SelectItem value="Monaco">Monaco</SelectItem>
                        <SelectItem value="Consolas">Consolas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Cursor Style</Label>
                    <Select
                      value={settings.terminalCursor}
                      onValueChange={(value: "block" | "line" | "underline") =>
                        handleSettingChange("terminalCursor", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="block">Block</SelectItem>
                        <SelectItem value="line">Line</SelectItem>
                        <SelectItem value="underline">Underline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Scrollback Lines</Label>
                    <Input
                      type="number"
                      min="100"
                      max="10000"
                      value={settings.scrollback}
                      onChange={(e) => handleSettingChange("scrollback", Number.parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <Card className="p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Security Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Save passwords</Label>
                      <p className="text-sm text-muted-foreground">Store connection passwords locally (encrypted)</p>
                    </div>
                    <Switch
                      checked={settings.savePasswords}
                      onCheckedChange={(checked) => handleSettingChange("savePasswords", checked)}
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => onOpenChange(false)}>Save Changes</Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
