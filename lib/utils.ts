import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Build a public invitation URL for a given token, choosing the correct base URL
// Priority: NEXT_PUBLIC_SITE_URL > VERCEL_URL (https) > production domain
export function buildInvitationUrl(token: string) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL
  const fromVercel = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
  
  // Use a production-ready domain instead of localhost
  const base = fromEnv || fromVercel || "https://wedding-erp.vercel.app"
  return `${base}/invite/${token}`
}
