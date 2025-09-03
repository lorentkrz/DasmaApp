import { createBrowserClient } from '@supabase/ssr'

// Backwards compatibility: allow imports that expect createBrowserClient from this module
export { createBrowserClient }

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
