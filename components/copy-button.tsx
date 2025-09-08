"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Loader2, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function CopyButton({ text }: { text: string }) {
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
      variant="outline" 
      onClick={handleCopy}
      disabled={copying}
      aria-busy={copying}
      className="hover:bg-blue-50 border-blue-200 shadow-sm transition-all duration-200 hover:shadow-md"
    >
      {copying ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Duke kopjuar...
        </>
      ) : copied ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          U kopjua!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </>
      )}
    </Button>
  )
}
