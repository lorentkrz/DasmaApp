"use client"

import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"

export function CopyButton({ text }: { text: string }) {
  return (
    <Button 
      type="button" 
      variant="outline" 
      onClick={() => navigator.clipboard.writeText(text)}
      className="hover:bg-blue-50 border-blue-200 shadow-sm transition-all duration-200 hover:shadow-md"
    >
      <Copy className="h-4 w-4 mr-2" /> Copy
    </Button>
  )
}
