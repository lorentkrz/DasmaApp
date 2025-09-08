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
  const startTime = Date.now()
  console.log('Tasks page loading started at:', new Date().toISOString())

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  console.log('User authenticated, loading wedding data...')
  const weddingStartTime = Date.now()

  // Get accessible wedding (RLS enforces access)
  const { data: weddings } = await supabase
    .from("weddings")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)

  console.log('Wedding query completed in:', Date.now() - weddingStartTime, 'ms')

  const wedding = weddings?.[0]
  if (!wedding) redirect("/dashboard/weddings/new")

  console.log('Loading task boards and tasks...')
  const boardsTasksStartTime = Date.now()

  // Load task boards and tasks in parallel with optimized seeding
  const boardsPromise = supabase
    .from("task_boards")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("position", { ascending: true })

  const tasksPromise = supabase
    .from("tasks")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("position", { ascending: true })

  const [{ data: boards }, { data: tasks }] = await Promise.all([boardsPromise, tasksPromise])

  console.log('Boards and tasks loaded in:', Date.now() - boardsTasksStartTime, 'ms')
  console.log('Found', boards?.length || 0, 'boards and', tasks?.length || 0, 'tasks')

  // Seed default boards only if none exist (optimized)
  let finalBoards = boards || []
  if (!boards || boards.length === 0) {
    console.log('Creating default task boards...')
    const seedStartTime = Date.now()
    
    const defaults = [
      { name: "To Do", position: 1, color: "#e5e7eb" },
      { name: "In Progress", position: 2, color: "#bfdbfe" },
      { name: "Review", position: 3, color: "#fef3c7" },
      { name: "Done", position: 4, color: "#bbf7d0" },
    ].map((b) => ({ ...b, wedding_id: wedding.id }))
    
    // Insert and immediately return the inserted data
    const { data: insertedBoards } = await supabase
      .from("task_boards")
      .insert(defaults)
      .select()
    
    finalBoards = insertedBoards || []
    console.log('Default boards created in:', Date.now() - seedStartTime, 'ms')
  }

  console.log('Total tasks page load time:', Date.now() - startTime, 'ms')
  console.log('Tasks page loading completed at:', new Date().toISOString())

  return (
    <TaskBoardRefactored boards={boards || []} tasks={tasks || []} weddingId={wedding.id} />
  )
}
