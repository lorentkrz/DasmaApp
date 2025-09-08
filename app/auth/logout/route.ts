import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

async function doLogout(request: Request) {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  // Redirect to login after sign-out
  const url = new URL("/auth/login", request.url)
  return NextResponse.redirect(url, { status: 302 })
}

export async function GET(request: Request) {
  return doLogout(request)
}

export async function POST(request: Request) {
  return doLogout(request)
}
