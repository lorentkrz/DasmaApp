import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// List of public routes that don't require authentication
const PUBLIC_PATHS = [
  "/",
  "/auth",
  "/invite",
  "/_next",
  "/favicon.ico",
  "/api/auth",
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/callback",
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next();

  try {
    // Extract cookies from the request for Supabase
    const getCookie = (name: string) => request.cookies.get(name)?.value || null;

    // Supabase server client for middleware
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: getCookie,
          set: () => {}, // cannot set cookies here; will use response.cookies if needed
          remove: () => {},
        } as any,
      }
    );

    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Supabase session error:", error);
    }

    // Allow public paths without login
    const isPublicPath = PUBLIC_PATHS.some(
      (path) =>
        request.nextUrl.pathname === path ||
        request.nextUrl.pathname.startsWith(`${path}/`)
    );

    // Redirect to login if no session and path is protected
    if (!session && !isPublicPath) {
      const redirectUrl = new URL("/auth/login", request.url);
      redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return response;
  } catch (err) {
    console.error("Middleware invocation failed:", err);
    return response;
  }
}

// Specify which paths the middleware should run on
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
