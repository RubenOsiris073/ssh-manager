"use client"

import type React from "react"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Edit, Trash2, Copy, Terminal, Settings } from "lucide-react"
import type { SSHConnection } from "./ssh-manager"

interface ConnectionContextMenuProps {
  children: React.ReactNode
  connection: SSHConnection
  onEdit: (connection: SSHConnection) => void
  onDelete: (connectionId: string) => void
  onDuplicate: (connection: SSHConnection) => void
  onOpenTerminal: (connectionId: string) => void
}

export function ConnectionContextMenu({
  children,
  connection,
  onEdit,
  onDelete,
  onDuplicate,
  onOpenTerminal,
}: ConnectionContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48 bg-popover border-border">
        <ContextMenuItem
          onClick={() => onOpenTerminal(connection.id)}
          className="text-popover-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Terminal className="h-4 w-4 mr-2" />
          Open Terminal
        </ContextMenuItem>

        <ContextMenuSeparator className="bg-border" />

        <ContextMenuItem
          onClick={() => onEdit(connection)}
          className="text-popover-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Connection
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => onDuplicate(connection)}
          className="text-popover-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Copy className="h-4 w-4 mr-2" />
          Duplicate
        </ContextMenuItem>

        <ContextMenuItem className="text-popover-foreground hover:bg-accent hover:text-accent-foreground">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </ContextMenuItem>

        <ContextMenuSeparator className="bg-border" />

        <ContextMenuItem
          onClick={() => onDelete(connection.id)}
          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
