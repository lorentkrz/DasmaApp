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
     * - favicon.ico, robots.txt, sitemap.xml (SEO files)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * - invite routes (public wedding invitations)
     * - api/auth routes (handled by Supabase)
     * - manifest files and service workers
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|invite(?:/.*)?|api/auth(?:/.*)?|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot|css|js|json|xml|txt|pdf)$).*)",
  ],
}
