"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface TaskFormProps {
  wedding: any
  boards: any[]
  defaultBoardId?: string
  task?: any
  onSuccess?: () => void
}

const TASK_PRIORITIES = ["low", "medium", "high", "urgent"]

export function TaskForm({ wedding, boards, defaultBoardId, task, onSuccess }: TaskFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "medium",
    due_date: task?.due_date || "",
    board_id: task?.board_id || defaultBoardId || boards?.[0]?.id || "",
  })

  useEffect(() => {
    if (!task && !formData.board_id && boards?.length) {
      setFormData((prev) => ({ ...prev, board_id: defaultBoardId || boards[0].id }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boards, defaultBoardId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Base fields for both create and update
      const baseData: any = {
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority,
        due_date: formData.due_date || null,
        wedding_id: wedding.id,
        board_id: formData.board_id,
      }

      let taskData: any = { ...baseData }

      if (!task) {
        // Only compute position on create
        const { data: posRows } = await supabase
          .from("tasks")
          .select("position")
          .eq("board_id", formData.board_id)
          .order("position", { ascending: false })
          .limit(1)
        const nextPos = (posRows?.[0]?.position || 0) + 1
        taskData.position = nextPos
      }

      if (task) {
        // Update existing task
        const { error } = await supabase.from("tasks").update(taskData).eq("id", task.id)

        if (error) throw error
        toast.success("Task updated successfully!")

        onSuccess?.()
      } else {
        // Create new task
        const { error } = await supabase.from("tasks").insert([taskData])

        if (error) throw error
        toast.success("Task created successfully!")

        onSuccess?.()
      }

      router.push("/dashboard/tasks")
      router.refresh()
    } catch (error) {
      console.error("Error saving task:", error)
      toast.error(`Error saving task: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/tasks">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <CardTitle className="text-slate-900">{task ? "Ndrysho Detyrën" : "Detyrë e Re"}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Titulli i Detyrës *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Rezervo sallën e dasmës"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Përshkrimi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Kontakto sallat dhe planifiko vizitat..."
              rows={3}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="priority">Prioriteti</Label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                {TASK_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="board_id">Kolona</Label>
              <select
                id="board_id"
                value={formData.board_id}
                onChange={(e) => setFormData({ ...formData, board_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                {boards?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Data e Afatit</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Link href="/dashboard/tasks">
              <Button variant="outline" type="button">
                Anulo
              </Button>
            </Link>
            <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800">
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Duke ruajtur..." : task ? "Përditëso Detyrën" : "Shto Detyrë"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
