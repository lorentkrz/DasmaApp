import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  // Get accessible wedding (RLS enforces access)
  const { data: weddings } = await supabase
    .from("weddings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)

  if (!weddings || weddings.length === 0) return new Response("No wedding", { status: 400 })
  const currentWedding = weddings[0]

  // Get guests with group information
  const { data: guests, error } = await supabase
    .from("guests")
    .select(`
      first_name,
      last_name,
      email,
      phone,
      address,
      guest_type,
      dietary_restrictions,
      plus_one_allowed,
      plus_one_name,
      rsvp_status,
      guest_groups!guests_group_id_fkey(
        group_name
      )
    `)
    .eq("wedding_id", currentWedding.id)
    .order("last_name", { ascending: true })

  if (error) return new Response(error.message, { status: 500 })

  const headers = [
    "Emri",
    "Mbiemri",
    "Email",
    "Telefoni",
    "Adresa",
    "Lloji",
    "Kufizime Ushqimore",
    "+1 Lejohet",
    "Emri i +1",
    "Statusi RSVP",
    "Grupi"
  ]
  
  const lines = [headers.join(",")]
  
  for (const g of guests || []) {
    const row = [
      g.first_name || "",
      g.last_name || "",
      g.email || "",
      g.phone || "",
      g.address || "",
      g.guest_type || "adult",
      g.dietary_restrictions || "",
      g.plus_one_allowed ? "Po" : "Jo",
      g.plus_one_name || "",
      g.rsvp_status || "pending",
      (g as any).guest_groups?.group_name || ""
    ].map(v => {
      const s = String(v)
      // Escape quotes and wrap in quotes if contains comma, newline, or quotes
      if (s.includes(',') || s.includes('\n') || s.includes('"')) {
        return '"' + s.replace(/"/g, '""') + '"'
      }
      return s
    })
    lines.push(row.join(","))
  }
  const csv = "\uFEFF" + lines.join("\n") // Add BOM for Excel UTF-8 support

  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `mysafiret_${currentWedding.groom_name}_${currentWedding.bride_name}_${timestamp}.csv`
  
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
