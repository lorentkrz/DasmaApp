"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Calendar, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface TaskAddModalProps {
  boardId?: string
  boardName?: string
  weddingId: string
  trigger?: React.ReactNode
}

export function TaskAddModal({ boardId, boardName, weddingId, trigger }: TaskAddModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    board_id: boardId || ""
  })

  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.board_id) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from("tasks")
        .insert({
          ...formData,
          wedding_id: weddingId,
          position: Date.now() // Simple position using timestamp
        })

      if (error) throw error

      setFormData({
        title: "",
        description: "",
        priority: "medium",
        due_date: "",
        board_id: boardId || ""
      })
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error creating task:", error)
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="w-full border-dashed border-2 border-gray-300 hover:border-gray-400 bg-gray-50/50 hover:bg-gray-50">
      <Plus className="h-4 w-4 mr-2" />
      Shto Detyrë
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-indigo-600" />
            Shto Detyrë të Re
            {boardName && <span className="text-sm text-gray-500">në {boardName}</span>}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titulli *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Shkruani titullin e detyrës..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Përshkrimi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Përshkrimi i detyrës (opsional)..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Prioriteti</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">E ulët</SelectItem>
                  <SelectItem value="medium">Mesatare</SelectItem>
                  <SelectItem value="high">E lartë</SelectItem>
                  <SelectItem value="urgent">Urgjente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Data e përfundimit</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {!boardId && (
            <div className="space-y-2">
              <Label htmlFor="board_id">Kolona *</Label>
              <Select value={formData.board_id} onValueChange={(value) => setFormData(prev => ({ ...prev, board_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Zgjidhni kolonën..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Zgjidhni kolonën...</SelectItem>
                  {/* Note: In real implementation, you'd pass boards as props */}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Anulo
            </Button>
            <Button type="submit" disabled={loading || !formData.title.trim()}>
              {loading ? "Duke shtuar..." : "Shto Detyrën"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
