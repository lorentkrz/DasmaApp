import { createBrowserClient } from '@supabase/ssr'

// Backwards compatibility: allow imports that expect createBrowserClient from this module
export { createBrowserClient }

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Override default cookie options for better production compatibility
        get(name: string) {
          if (typeof document === 'undefined') return ''
          const cookies = document.cookie.split('; ')
          const cookie = cookies.find(c => c.startsWith(`${name}=`))
          return cookie ? decodeURIComponent(cookie.split('=')[1]) : ''
        },
        set(name: string, value: string, options?: any) {
          if (typeof document === 'undefined') return
          
          let cookieString = `${name}=${encodeURIComponent(value)}`
          
          if (options?.maxAge) {
            cookieString += `; Max-Age=${options.maxAge}`
          }
          if (options?.expires) {
            cookieString += `; Expires=${options.expires.toUTCString()}`
          }
          
          cookieString += `; Path=${options?.path || '/'}`
          cookieString += '; SameSite=Lax'
          
          if (process.env.NODE_ENV === 'production') {
            cookieString += '; Secure'
          }
          
          document.cookie = cookieString
        },
        remove(name: string, options?: any) {
          if (typeof document === 'undefined') return
          document.cookie = `${name}=; Path=${options?.path || '/'}; Max-Age=0`
        }
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    }
  )
}
