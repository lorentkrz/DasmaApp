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
          // Update request cookies first
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          
          // Create a new response with updated request
          supabaseResponse = NextResponse.next({
            request,
          })
          
          // Set cookies in the response with proper options for production
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, {
              ...options,
              // Critical: ensure proper cookie settings for production
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              httpOnly: true,
              path: '/',
              // Ensure domain is not set to allow cookies to work properly
              domain: undefined
            })
          })
        },
      },
    },
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  let user = null
  let userError: any = null
  let shouldRetry = false

  try {
    // IMPORTANT: If you remove getUser() and you use server-side rendering
    // with the Supabase client, your users may be randomly logged out.
    const authResult = await supabase.auth.getUser()
    user = authResult.data?.user || null
    userError = authResult.error

    // Check for specific auth errors that indicate session issues
    if (userError) {
      const isTokenExpired = userError.message?.includes('expired') ||
        userError.message?.includes('invalid') ||
        userError.message?.includes('JWT')

      if (isTokenExpired) {
        console.log("Token expired, attempting refresh...")
        shouldRetry = true

        // Try to refresh the session
        const { data: sessionData, error: refreshError } = await supabase.auth.refreshSession()
        if (!refreshError && sessionData?.user) {
          user = sessionData.user
          userError = null
          console.log("Session refreshed successfully")
        } else {
          console.log("Session refresh failed:", refreshError?.message)
        }
      }
    }
  } catch (error: any) {
    console.error("Auth check failed:", error?.message)
    userError = error
    user = null
  }

  // Allow access to auth pages, home page, API routes, and invite routes without authentication
  const publicPaths = [
    "/auth/login",
    "/auth/register",
    "/auth/error",
    "/auth/logout",
    "/",
    "/invite",
    "/api" // Add API routes as public
  ]

  const isPublicPath = publicPaths.some(path => {
    if (path === "/") {
      return request.nextUrl.pathname === "/"
    }
    return request.nextUrl.pathname.startsWith(path)
  })

  // Enhanced logging for debugging
  const debugInfo = {
    path: request.nextUrl.pathname,
    hasUser: !!user,
    userError: userError?.message || null,
    isPublicPath,
    userAgent: request.headers.get('user-agent')?.slice(0, 50),
    timestamp: new Date().toISOString()
  }

  // If there's an auth error or no user, and it's not a public path, redirect to login
  if ((userError || !user) && !isPublicPath) {
    // Don't log every redirect to avoid spam, but log periodically
    if (Math.random() < 0.1) { // Log ~10% of redirects
      console.log("Middleware redirecting to login:", debugInfo)
    }

    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("redirectedFrom", request.nextUrl.pathname)

    // Add headers to help with debugging
    const response = NextResponse.redirect(url)
    response.headers.set('X-Auth-Redirect-Reason', userError?.message || 'No user session')
    return response
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (user && request.nextUrl.pathname.startsWith("/auth/") && request.nextUrl.pathname !== "/auth/logout") {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  // Add auth headers for debugging
  if (user) {
    supabaseResponse.headers.set('X-User-ID', user.id)
    supabaseResponse.headers.set('X-Auth-Status', 'authenticated')
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  return supabaseResponse
}
