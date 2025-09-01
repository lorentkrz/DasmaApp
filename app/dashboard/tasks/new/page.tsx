import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TaskForm } from "@/components/task-form"

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: { board?: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Accessible wedding via RLS
  const { data: weddings } = await supabase
    .from("weddings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
  const wedding = weddings?.[0]
  if (!wedding) redirect("/dashboard/weddings/new")

  // Boards for this wedding
  const { data: boards } = await supabase
    .from("task_boards")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("position", { ascending: true })

  const defaultBoardId = searchParams?.board && boards?.some((b) => b.id === searchParams.board)
    ? searchParams.board
    : boards?.[0]?.id

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-amber-900">Add New Task</h1>
        <p className="text-amber-700">Create a new wedding planning task</p>
      </div>

      <TaskForm wedding={wedding} boards={boards || []} defaultBoardId={defaultBoardId} />
    </div>
  )
}
