import { NextResponse } from "next/server"
import { unstable_cache } from "next/cache"
import { createClient } from "@/lib/supabase/server"

// Cached getter (10 minutes)
const getDbSchema = unstable_cache(
  async () => {
    const supabase = await createClient()

    // Try reading from a materialized view for speed
    const { data, error } = await supabase
      .from("mv_db_schema")
      .select("*")

    if (error) {
      // If the matview doesn't exist, surface a helpful message but do not 500
      return {
        warning: "mv_db_schema not found - run scripts/901_cache_materialized_views.sql or adjust endpoint",
        tables: [],
      }
    }

    return { tables: data ?? [] }
  },
  ["db-schema-cache"],
  { revalidate: 60 * 10 }
)

export async function GET() {
  try {
    const payload = await getDbSchema()
    return new NextResponse(JSON.stringify(payload), {
      status: 200,
      headers: {
        "content-type": "application/json",
        // Cache at the edge/CDN and allow stale-while-revalidate
        "Cache-Control": "s-maxage=600, stale-while-revalidate=600",
      },
    })
  } catch (e: any) {
    return new NextResponse(
      JSON.stringify({ tables: [], error: e?.message }),
      { status: 200, headers: { "content-type": "application/json" } }
    )
  }
}
