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
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-indigo-600" />
            Shto Ofrues të Ri
          </DialogTitle>
        </DialogHeader>
        <VendorForm wedding={wedding} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
