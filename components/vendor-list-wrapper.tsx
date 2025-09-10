"use client"

import { useState } from "react"
import { VendorListRefactored } from "@/components/vendor-list-refactored"
import { VendorEditDialog } from "@/components/vendor-edit-dialog"

interface VendorListWrapperProps {
  wedding: any
  vendors: any[]
  initialQuery?: string
}

export function VendorListWrapper({ wedding, vendors, initialQuery }: VendorListWrapperProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)

  return (
    <>
      <VendorListRefactored
        vendors={vendors}
        initialQuery={initialQuery}
        onEdit={(vendor) => {
          setSelected(vendor)
          setOpen(true)
        }}
      />
      <VendorEditDialog wedding={wedding} vendor={selected} open={open} onOpenChange={setOpen} />
    </>
  )
}
