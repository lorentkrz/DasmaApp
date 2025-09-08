import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    // Create a Supabase client with cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // Clone the response to avoid mutating the original
            const newResponse = NextResponse.next()
            
            // Set the cookie with proper options
            newResponse.cookies.set({
              name,
              value,
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
            })
            
            // Update the response that will be returned
            response = newResponse
          },
          remove(name: string, options: any) {
            // Clone the response to avoid mutating the original
            const newResponse = NextResponse.next()
            
            // Delete the cookie
            newResponse.cookies.set({
              name,
              value: '',
              ...options,
              maxAge: 0,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
            })
            
            // Update the response that will be returned
            response = newResponse
          },
        },
      }
    )

    // Refresh session if expired - required for Server Components
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error)
      return response
    }
    
    // Define public paths that don't require authentication
    const publicPaths = [
      '/',
      '/auth',
      '/invite',
      '/_next',
      '/favicon.ico',
      '/api/auth',
      '/auth/login',
      '/auth/signup',
      '/auth/forgot-password',
      '/auth/callback',
    ]
    
    // Check if current path is public
    const isPublicPath = publicPaths.some(path => 
      request.nextUrl.pathname === path || 
      request.nextUrl.pathname.startsWith(`${path}/`)
    )
    
    // If no session and not on a public path, redirect to login
    if (!session && !isPublicPath) {
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    return response
    
  } catch (error) {
    console.error('Error in Supabase middleware:', error)
    return response
  }
}
