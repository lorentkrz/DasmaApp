"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { VendorForm } from "@/components/vendor-form"

interface VendorAddButtonProps {
  wedding: any
}

export function VendorAddButton({ wedding }: VendorAddButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white">
          + Add Vendor
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>
            Shto Ofrues të Ri
          </DialogTitle>
        </DialogHeader>
        <VendorForm wedding={wedding} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
