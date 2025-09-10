"use client"

import { useState } from "react"
import { GuestListEnterprise } from "@/components/guest-list-enterprise"
import { GuestEditDialog } from "@/components/guest-edit-dialog"

interface GuestListWrapperProps {
  wedding: any
  guests: any[]
  groups: any[]
}

export function GuestListWrapper({ wedding, guests, groups }: GuestListWrapperProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)

  return (
    <>
      <GuestListEnterprise
        guests={guests}
        groups={groups}
        onEdit={(guest) => {
          setSelected(guest)
          setOpen(true)
        }}
      />
      <GuestEditDialog guest={selected} open={open} onOpenChange={setOpen} />
    </>
  )
}
