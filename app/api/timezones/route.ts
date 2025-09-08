import { NextResponse } from "next/server"
import { unstable_cache } from "next/cache"

// Static fallback list (top/common zones) to avoid DB calls entirely if desired
// You can expand this or replace by DB-backed fetch if you prefer.
const STATIC_TIMEZONES = [
  "UTC",
  "Europe/Berlin",
  "Europe/Paris",
  "Europe/Rome",
  "Europe/London",
  "Europe/Tirane",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Asia/Dubai",
  "Asia/Tokyo",
  "Asia/Singapore",
]

// If you want DB-backed timezones, flip USE_DB to true and implement a fetch
const USE_DB = false

// Cached getter (7 days)
const getTimezones = unstable_cache(
  async () => {
    if (!USE_DB) return STATIC_TIMEZONES

    // Example DB-backed implementation (disabled by default):
    // const supabase = await import("@/lib/supabase/server").then(m => m.createClient())
    // const { data, error } = await supabase.from("mv_pg_timezone_names").select("name").order("name")
    // if (error) throw error
    // return (data ?? []).map((r: any) => r.name)

    return STATIC_TIMEZONES
  },
  ["timezones-cache"],
  { revalidate: 60 * 60 * 24 * 7 } // 7 days
)

export async function GET() {
  try {
    const tz = await getTimezones()
    return new NextResponse(JSON.stringify({ timezones: tz }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        // Cache at the edge/CDN and allow stale-while-revalidate
        "Cache-Control": "s-maxage=604800, stale-while-revalidate=86400",
      },
    })
  } catch (e: any) {
    return new NextResponse(
      JSON.stringify({ timezones: STATIC_TIMEZONES, warning: "served-static", error: e?.message }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    )
  }
}
