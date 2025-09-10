import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function doLogout(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  const url = new URL("/auth/login", request.url)
  return NextResponse.redirect(url, { status: 302 })
}

export async function GET(request: Request) {
  return doLogout(request)
}

export async function POST(request: Request) {
  return doLogout(request)
}
