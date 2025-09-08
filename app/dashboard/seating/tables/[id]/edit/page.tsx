"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { toast } from "sonner"

export default function EditTablePage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    table_number: "",
    table_name: "",
    capacity: "8",
    table_type: "round",
    notes: "",
  })

  useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("wedding_tables")
          .select("id, table_number, table_name, capacity, table_type, notes")
          .eq("id", id)
          .single()
        if (error) throw error
        if (ignore) return
        setForm({
          table_number: String(data.table_number ?? ""),
          table_name: data.table_name ?? "",
          capacity: String(data.capacity ?? "8"),
          table_type: data.table_type ?? "round",
          notes: data.notes ?? "",
        })
      } catch (e: any) {
        setError(e?.message || "Nuk u ngarkua tavolina")
      } finally {
        setLoading(false)
      }
    }
    if (id) load()
    return () => {
      ignore = true
    }
  }, [id, supabase])

  const onChange = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }))

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError(null)
      const { error } = await supabase
        .from("wedding_tables")
        .update({
          table_number: Number.parseInt(form.table_number),
          table_name: form.table_name || null,
          capacity: Number.parseInt(form.capacity),
          table_type: form.table_type,
          notes: form.notes || null,
        })
        .eq("id", id)
      if (error) throw error
      toast.success("Tavolina u përditësua")
      router.push("/dashboard/seating/tables")
    } catch (e: any) {
      setError(e?.message || "Nuk u ruajt")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/seating/tables">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kthehu te tavolinat
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ndrysho Tavolinën</CardTitle>
            <CardDescription>Modifiko detajet e tavolinës</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Duke ngarkuar...</div>
            ) : (
              <form onSubmit={onSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="table_number">Numri i Tavolinës</Label>
                    <Input id="table_number" type="number" min={1} value={form.table_number} onChange={(e) => onChange("table_number", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="table_name">Emri i Tavolinës</Label>
                    <Input id="table_name" value={form.table_name} onChange={(e) => onChange("table_name", e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Kapaciteti</Label>
                    <Input id="capacity" type="number" min={1} max={20} value={form.capacity} onChange={(e) => onChange("capacity", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="table_type">Lloji</Label>
                    <Select value={form.table_type} onValueChange={(v) => onChange("table_type", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="round">Rrethore</SelectItem>
                        <SelectItem value="rectangular">Drejtkëndore</SelectItem>
                        <SelectItem value="square">Katror</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Shënime</Label>
                  <Textarea id="notes" value={form.notes} onChange={(e) => onChange("notes", e.target.value)} />
                </div>

                {error && <div className="text-sm text-destructive">{error}</div>}

                <div className="flex gap-3">
                  <Button type="submit" disabled={saving}>
                    <Save className="h-4 w-4 mr-2" /> {saving ? "Duke ruajtur..." : "Ruaj"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.push("/dashboard/seating/tables")}>Anulo</Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
