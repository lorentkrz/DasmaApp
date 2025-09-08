import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const PUBLIC_PATHS = [
  "/",
  "/auth",
  "/invite",
  "/favicon.ico",
  "/api/auth",
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/callback",
]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next()
  const supabase = createSupabaseServerClient(request, response)

  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) console.error("Supabase middleware error:", error)

  const isPublicPath = PUBLIC_PATHS.some(
    (path) =>
      request.nextUrl.pathname === path ||
      request.nextUrl.pathname.startsWith(`${path}/`)
  )

  if (!session && !isPublicPath) {
    const redirectUrl = new URL("/auth/login", request.url)
    redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
