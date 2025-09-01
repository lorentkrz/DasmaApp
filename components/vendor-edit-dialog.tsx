"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { VendorForm } from "@/components/vendor-form"

interface VendorEditDialogProps {
  wedding: any
  vendor: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VendorEditDialog({ wedding, vendor, open, onOpenChange }: VendorEditDialogProps) {
  const [current, setCurrent] = useState<any | null>(vendor)

  useEffect(() => {
    if (open) setCurrent(vendor)
  }, [open, vendor])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Edit Vendor</DialogTitle>
        </DialogHeader>
        {current && <VendorForm wedding={wedding} vendor={current} />}
      </DialogContent>
    </Dialog>
  )
}
