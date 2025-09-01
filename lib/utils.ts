import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Build a public invitation URL for a given token, choosing the correct base URL
// Priority: NEXT_PUBLIC_SITE_URL > VERCEL_URL (https) > localhost
export function buildInvitationUrl(token: string) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL
  const fromVercel = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
  const base = fromEnv || fromVercel || "http://localhost:3000"
  return `${base}/invite/${token}`
}
