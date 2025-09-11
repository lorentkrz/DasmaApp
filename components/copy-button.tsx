"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Loader2, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type CopyButtonProps = {
  text: string
  label?: string
  size?: "sm" | "default" | "lg"
  variant?: "default" | "outline" | "ghost"
  className?: string
  iconOnly?: boolean
}

export function CopyButton({ text, label = "Kopjo", size = "sm", variant = "outline", className = "", iconOnly = false }: CopyButtonProps) {
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopy = async () => {
    try {
      setCopying(true)
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({ title: "U kopjua", description: "Teksti u kopjua në kujtesë." })
      setTimeout(() => setCopied(false), 1200)
    } catch (e: any) {
      toast({ title: "Gabim", description: e?.message || "Nuk u kopjua", variant: "destructive" })
    } finally {
      setCopying(false)
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={handleCopy}
      disabled={copying}
      aria-busy={copying}
      className={`shadow-sm transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-300 ${className}`}
    >
      {copying ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {!iconOnly && <span className="ml-2">Duke kopjuar...</span>}
        </>
      ) : copied ? (
        <>
          <Check className="h-4 w-4" />
          {!iconOnly && <span className="ml-2">U kopjua!</span>}
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          {!iconOnly && <span className="ml-2">{label}</span>}
        </>
      )}
    </Button>
  )
}
