import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getUser() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  // Allow access to auth pages, home page, and invite routes without authentication
  const publicPaths = [
    "/auth/login",
    "/auth/register",
    "/auth/error",
    "/auth/logout",
    "/",
    "/invite"
  ]

  const isPublicPath = publicPaths.some(path =>
    request.nextUrl.pathname === path ||
    request.nextUrl.pathname.startsWith(`${path}/`)
  )

  // If there's an auth error or no user, and it's not a public path, redirect to login
  if ((userError || !user) && !isPublicPath) {
    console.log("Middleware redirecting to login:", {
      path: request.nextUrl.pathname,
      hasUser: !!user,
      error: userError?.message
    })
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("redirectedFrom", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (user && request.nextUrl.pathname.startsWith("/auth/") && request.nextUrl.pathname !== "/auth/logout") {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  return supabaseResponse
}
