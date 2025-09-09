import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /* // test
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    // Skip middleware entirely for public invite pages
    // Also continue to skip static assets and images
    "/((?!_next/static|_next/image|favicon.ico|invite(?:/.*)?|.*.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
