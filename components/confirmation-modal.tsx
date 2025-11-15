"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2 } from "lucide-react"

interface ConfirmationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  variant?: "default" | "destructive"
  icon?: "warning" | "delete"
}

export function ConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  variant = "default",
  icon = "warning",
}: ConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const IconComponent = icon === "delete" ? Trash2 : AlertTriangle

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${
                variant === "destructive" ? "bg-destructive/10 text-destructive" : "bg-yellow-500/10 text-yellow-500"
              }`}
            >
              <IconComponent className="h-5 w-5" />
            </div>
            <DialogTitle className="text-card-foreground">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground ml-10">{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={variant}
            onClick={handleConfirm}
            className={
              variant === "destructive"
                ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
