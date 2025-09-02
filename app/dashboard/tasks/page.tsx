import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TaskBoard } from "@/components/task-board"
import { Button } from "@/components/ui/button"
import { Plus, Heart, Sparkles, CheckSquare } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function TasksPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Get current wedding (accessible via RLS: owner or collaborator)
  const { data: weddings } = await supabase
    .from("weddings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)

  const wedding = weddings?.[0]
  if (!wedding) redirect("/dashboard/weddings/new")

  // Load task boards
  let { data: boards } = await supabase
    .from("task_boards")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("position", { ascending: true })

  // Seed default boards if none exist
  if (!boards || boards.length === 0) {
    const defaults = [
      { name: "To Do", position: 1, color: "#e5e7eb" },
      { name: "In Progress", position: 2, color: "#bfdbfe" },
      { name: "Review", position: 3, color: "#fef3c7" },
      { name: "Done", position: 4, color: "#bbf7d0" },
    ].map((b) => ({ ...b, wedding_id: wedding.id }))
    await supabase.from("task_boards").insert(defaults)
    const boardsRes = await supabase
      .from("task_boards")
      .select("*")
      .eq("wedding_id", wedding.id)
      .order("position", { ascending: true })
    boards = boardsRes.data || []
  }

  // Get tasks (order by position within board)
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("position", { ascending: true })

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-rose-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-amber-200/30 to-rose-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-200/20 to-amber-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="space-y-8 px-4 md:px-6 pt-6 relative z-10">
        {/* Enhanced Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center shadow-lg">
                <CheckSquare className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Menaxhimi i Detyrave
              </h1>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
              <p className="text-gray-700 font-medium text-lg">
                Organizoni dhe gjurmoni të gjitha detyrat për planifikimin e dasmës
              </p>
            </div>
          </div>
          <div className="mt-6 md:mt-0">
            <Link href="/dashboard/tasks/new">
              <Button size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
                <Plus className="h-5 w-5 mr-2" />
                Shto Detyrë të Re
              </Button>
            </Link>
          </div>
        </div>

        <TaskBoard boards={boards || []} tasks={tasks || []} weddingId={wedding.id} />
      </div>
    </div>
  )
}
