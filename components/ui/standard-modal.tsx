"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface StandardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  onSave?: () => void
  onCancel?: () => void
  saveText?: string
  cancelText?: string
  saving?: boolean
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function StandardModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  onSave,
  onCancel,
  saveText = "Save",
  cancelText = "Cancel",
  saving = false,
  size = "md",
  className,
}: StandardModalProps) {
  const handleEscape = React.useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && !saving) {
      onOpenChange(false)
    }
  }, [saving, onOpenChange])

  React.useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscape)
      return () => document.removeEventListener("keydown", handleEscape)
    }
  }, [open, handleEscape])

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(sizeClasses[size], "gap-0", className)}
        onPointerDownOutside={(e) => {
          if (saving) e.preventDefault()
        }}
      >
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {children}
        </div>
        
        {(footer || onSave || onCancel) && (
          <DialogFooter className="px-6 py-4 border-t bg-gray-50/50">
            {footer || (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    onCancel?.()
                    onOpenChange(false)
                  }}
                  disabled={saving}
                >
                  {cancelText}
                </Button>
                {onSave && (
                  <Button
                    onClick={() => {
                      onSave()
                    }}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : saveText}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
