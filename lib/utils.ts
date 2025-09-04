import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Build a public invitation URL for a given token, choosing the correct base URL
// Priority: NEXT_PUBLIC_SITE_URL > hardcoded production domain
export function buildInvitationUrl(token: string) {
  // If we're in the browser (e.g., Copy button), use the actual current origin
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin
    return `${origin}/invite/${token}`
  }

  // Server-side: derive from environment
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL
  // Do NOT use VERCEL_URL for invites, as it may point to preview deployments which can be protected.
  // const fromVercel = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined

  // Sensible fallback for local development
  const fallback = 'http://localhost:3000'
  // Hardcoded production base to ensure WhatsApp messages always use the public domain
  const hardcodedProd = 'https://dasma-app.vercel.app'

  const base = fromEnv || hardcodedProd || fallback
  return `${base}/invite/${token}`
}
