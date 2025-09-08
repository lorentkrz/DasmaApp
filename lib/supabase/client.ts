import { createBrowserClient } from '@supabase/ssr'

// Backwards compatibility: allow imports that expect createBrowserClient from this module
export { createBrowserClient }

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      cookies: {
        get(name) {
          return document.cookie.split('; ').find(row => row.startsWith(`${name}=`))?.split('=')[1]
        },
        set(name, value, options) {
          document.cookie = `${name}=${value}; ${Object.entries(options).map(([k, v]) => `${k}=${v}`).join('; ')}`
        },
        remove(name, options) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${Object.entries(options).map(([k, v]) => `${k}=${v}`).join('; ')}`
        },
      },
      cookieOptions: {
        name: 'sb-auth-token',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true
      }
    }
  )
}
