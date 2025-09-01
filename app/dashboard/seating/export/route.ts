import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const { data: weddings } = await supabase
    .from("weddings")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)

  if (!weddings || weddings.length === 0) return new Response("No wedding", { status: 400 })
  const currentWedding = weddings[0]

  // tables and assigned guests
  const [{ data: tables }, { data: guests }] = await Promise.all([
    supabase.from("wedding_tables").select("id, table_number, table_name, capacity").eq("wedding_id", currentWedding.id).order("table_number"),
    supabase.from("guests").select("id, first_name, last_name, plus_one_name, table_assignment").eq("wedding_id", currentWedding.id).not("table_assignment", "is", null)
  ])

  const tableMap = new Map((tables || []).map((t: any) => [t.id, t]))

  const headers = ["table_number","table_name","guest_first","guest_last","plus_one"]
  const lines = [headers.join(",")]

  for (const g of guests || []) {
    const t = tableMap.get(g.table_assignment)
    const row = [
      t?.table_number ?? "",
      (t?.table_name ?? "").toString(),
      (g.first_name ?? "").toString(),
      (g.last_name ?? "").toString(),
      (g.plus_one_name ?? "").toString(),
    ].map((v) => '"' + String(v).replace(/"/g, '""') + '"')
    lines.push(row.join(","))
  }

  const csv = lines.join("\n")
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=seating_assignments.csv`,
      "Cache-Control": "no-store",
    },
  })
}
