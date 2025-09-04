import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Build a public invitation URL for a given token, choosing the correct base URL
// Priority: NEXT_PUBLIC_SITE_URL > VERCEL_URL (https) > production domain
export function buildInvitationUrl(token: string) {
  // If we're in the browser (e.g., Copy button), use the actual current origin
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin
    return `${origin}/invite/${token}`
  }

  // Server-side: derive from environment
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL
  const fromVercel = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined

  // Sensible fallback for local development
  const fallback = 'http://localhost:3000'

  const base = fromEnv || fromVercel || fallback
  return `${base}/invite/${token}`
}
