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
import { ArrowLeft, Save, Calendar } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function EditTaskPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [boards, setBoards] = useState<any[]>([])
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    assigned_to: "",
    board_id: "",
  })

  useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        setLoading(true)
        // Load task data
        const { data: task, error: taskError } = await supabase
          .from("tasks")
          .select("*")
          .eq("id", id)
          .single()
        if (taskError) throw taskError

        // Load boards for the dropdown
        const { data: boardsData, error: boardsError } = await supabase
          .from("task_boards")
          .select("*")
          .order("position")
        if (boardsError) throw boardsError

        if (ignore) return
        setBoards(boardsData || [])
        setForm({
          title: task.title || "",
          description: task.description || "",
          priority: task.priority || "medium",
          due_date: task.due_date ? task.due_date.split('T')[0] : "",
          assigned_to: task.assigned_to || "",
          board_id: task.board_id || "",
        })
      } catch (e: any) {
        setError(e?.message || "Nuk u ngarkua detyra")
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
        .from("tasks")
        .update({
          title: form.title,
          description: form.description || null,
          priority: form.priority,
          due_date: form.due_date || null,
          assigned_to: form.assigned_to || null,
          board_id: form.board_id,
        })
        .eq("id", id)
      if (error) throw error
      toast.success("Detyra u përditësua")
      router.push("/dashboard/tasks")
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
            <Link href="/dashboard/tasks">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kthehu te detyrat
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ndrysho Detyrën</CardTitle>
            <CardDescription>Modifiko detajet e detyrës</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Duke ngarkuar...</div>
            ) : (
              <form onSubmit={onSave} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Titulli *</Label>
                  <Input id="title" value={form.title} onChange={(e) => onChange("title", e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Përshkrimi</Label>
                  <Textarea id="description" value={form.description} onChange={(e) => onChange("description", e.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioriteti</Label>
                    <Select value={form.priority} onValueChange={(v) => onChange("priority", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">I ulët</SelectItem>
                        <SelectItem value="medium">Mesatar</SelectItem>
                        <SelectItem value="high">I lartë</SelectItem>
                        <SelectItem value="urgent">Urgjent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="board_id">Lista</Label>
                    <Select value={form.board_id} onValueChange={(v) => onChange("board_id", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {boards.map((board) => (
                          <SelectItem key={board.id} value={board.id}>
                            {board.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Data e skadimit</Label>
                    <Input id="due_date" type="date" value={form.due_date} onChange={(e) => onChange("due_date", e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assigned_to">Caktuar për</Label>
                    <Input id="assigned_to" value={form.assigned_to} onChange={(e) => onChange("assigned_to", e.target.value)} placeholder="Emri ose email" />
                  </div>
                </div>

                {error && <div className="text-sm text-destructive">{error}</div>}

                <div className="flex gap-3">
                  <Button type="submit" disabled={saving}>
                    <Save className="h-4 w-4 mr-2" /> {saving ? "Duke ruajtur..." : "Ruaj"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.push("/dashboard/tasks")}>Anulo</Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
