"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SSHConnection } from "./ssh-manager"

interface ConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddConnection: (connection: Omit<SSHConnection, "id" | "status">) => void
  editingConnection?: SSHConnection | null
}

export function ConnectionDialog({ open, onOpenChange, onAddConnection, editingConnection }: ConnectionDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    host: "",
    port: 22,
    username: "",
  })

  useEffect(() => {
    if (editingConnection) {
      setFormData({
        name: editingConnection.name,
        host: editingConnection.host,
        port: editingConnection.port,
        username: editingConnection.username,
      })
    } else {
      setFormData({
        name: "",
        host: "",
        port: 22,
        username: "",
      })
    }
  }, [editingConnection, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.host || !formData.username) {
      return
    }

    onAddConnection(formData)

    // Reset form only if not editing
    if (!editingConnection) {
      setFormData({
        name: "",
        host: "",
        port: 22,
        username: "",
      })
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">
            {editingConnection ? "Edit SSH Connection" : "Add SSH Connection"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {editingConnection
              ? "Update the connection details below."
              : "Configure a new SSH connection to manage your servers."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-card-foreground">
              Connection Name
            </Label>
            <Input
              id="name"
              placeholder="Production Server"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="bg-input border-border text-foreground"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="host" className="text-card-foreground">
                Host
              </Label>
              <Input
                id="host"
                placeholder="192.168.1.100"
                value={formData.host}
                onChange={(e) => handleInputChange("host", e.target.value)}
                className="bg-input border-border text-foreground"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="port" className="text-card-foreground">
                Port
              </Label>
              <Input
                id="port"
                type="number"
                placeholder="22"
                value={formData.port}
                onChange={(e) => handleInputChange("port", Number.parseInt(e.target.value) || 22)}
                className="bg-input border-border text-foreground"
                min="1"
                max="65535"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="text-card-foreground">
              Username
            </Label>
            <Input
              id="username"
              placeholder="root"
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              className="bg-input border-border text-foreground"
              required
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border hover:bg-muted"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {editingConnection ? "Update Connection" : "Add Connection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
