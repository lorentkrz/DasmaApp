import { createBrowserClient } from '@supabase/ssr'

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
      cookieOptions: {
        name: 'sb-wedding-erp-auth',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  )
}

// Backwards compatibility: allow imports that expect createBrowserClient from this module
export { createBrowserClient }
