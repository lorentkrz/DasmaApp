import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createServerClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, {
              ...options,
              // Enhanced cookie options for better reliability
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              httpOnly: false, // Allow client-side access for auth
            })
          })
        } catch (error: any) {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
          console.warn("Cookie setting failed in Server Component:", {
            error: error?.message,
            cookieCount: cookiesToSet.length,
            hasMiddleware: true
          })
        }
      },
    },
  })
}

/**
 * Enhanced server client with automatic retry and better error handling
 */
export async function createServerClientWithRetry() {
  let retries = 0
  const maxRetries = 2

  while (retries < maxRetries) {
    try {
      const client = await createServerClient()

      // Test the connection with a simple auth check
      const { data, error } = await client.auth.getUser()

      if (error && retries < maxRetries - 1) {
        console.log(`Auth check failed (attempt ${retries + 1}/${maxRetries}):`, error.message)
        retries++
        // Small delay before retry
        await new Promise(resolve => setTimeout(resolve, 100))
        continue
      }

      return client
    } catch (error: any) {
      console.error(`Server client creation failed (attempt ${retries + 1}/${maxRetries}):`, error?.message)
      if (retries >= maxRetries - 1) {
        throw error
      }
      retries++
    }
  }

  // Fallback to regular client
  return createServerClient()
}

// Keep the original export for backward compatibility
export async function createClient() {
  return createServerClient()
}

/**
 * Utility function to safely get user with proper error handling
 */
export async function getSafeUser() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.warn("User fetch error:", error.message)
      return { user: null, error }
    }

    return { user, error: null }
  } catch (error: any) {
    console.error("Safe user fetch failed:", error?.message)
    return { user: null, error }
  }
}
