import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TaskBoardRefactored } from "@/components/task-board-refactored"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Plus, CheckSquare } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export async function generateMetadata() {
  return {
    title: 'Lista e Punëve - Dasma ERP',
    description: 'Organizoni dhe ndiqni të gjitha detyrat për dasmën tuaj të përsosur'
  }
}

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
    <TaskBoardRefactored boards={boards || []} tasks={tasks || []} weddingId={wedding.id} />
  )
}
