import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const form = await req.formData()
  const file = form.get("file") as File | null
  if (!file) return new Response("No file", { status: 400 })

  // Determine current wedding
  const { data: weddings } = await supabase
    .from("weddings")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)

  if (!weddings || weddings.length === 0) return new Response("No wedding", { status: 400 })
  const currentWedding = weddings[0]

  // Parse CSV (expects headers like our export)
  const text = await file.text()
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return new Response("Empty file", { status: 400 })

  // Simple CSV parsing for quoted values
  const parseCsvLine = (line: string) => {
    const result: string[] = []
    let cur = ""
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else { inQuotes = !inQuotes }
      } else if (ch === ',' && !inQuotes) {
        result.push(cur); cur = ""
      } else {
        cur += ch
      }
    }
    result.push(cur)
    return result
  }

  const header = parseCsvLine(lines[0]).map((h) => h.trim().replace(/^"|"$/g, ""))
  const expected = [
    "first_name","last_name","email","phone","address","guest_type","dietary_restrictions","plus_one_allowed","plus_one_name","rsvp_status"
  ]
  for (const col of expected) {
    if (!header.includes(col)) return new Response(`Missing column: ${col}`, { status: 400 })
  }

  const rows = lines.slice(1).map(parseCsvLine).map((cols) => cols.map((c) => c.replace(/^"|"$/g, "")))

  const payload = rows.map((cols) => {
    const rec: Record<string, any> = {}
    header.forEach((h, idx) => { rec[h] = cols[idx] ?? null })
    rec.plus_one_allowed = String(rec.plus_one_allowed).toLowerCase() === "true"
    rec.wedding_id = currentWedding.id
    return rec
  }).filter((r) => r.first_name || r.last_name)

  if (payload.length === 0) return new Response("No records", { status: 400 })

  const { error } = await supabase.from("guests").insert(payload)
  if (error) return new Response(error.message, { status: 500 })

  return new Response(JSON.stringify({ inserted: payload.length }), { status: 200 })
}
