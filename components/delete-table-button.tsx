"use client"

import { createClient } from "@/lib/supabase/client"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface DeleteTableButtonProps {
  id: string
}

export default function DeleteTableButton({ id }: DeleteTableButtonProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (loading) return
    const ok = window.confirm("A jeni i sigurt që dëshironi ta fshini këtë tavolinë? Kjo nuk mund të zhbëhet.")
    if (!ok) return
    try {
      setLoading(true)
      const { error } = await supabase.from("wedding_tables").delete().eq("id", id)
      if (error) throw error
      toast.success("Tavolina u fshi")
      // simple reload to refresh list
      window.location.reload()
    } catch (e: any) {
      toast.error(e?.message || "Nuk u fshi tavolina")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete} disabled={loading}>
      <Trash2 className="h-4 w-4 mr-2" />
      {loading ? "Duke fshirë..." : "Fshi"}
    </DropdownMenuItem>
  )
}
