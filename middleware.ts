import { createServerClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    // Create Supabase server client with proper cookie handling
    const supabase = createServerClient();

    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Error getting session:", error);
      return response;
    }

    // Define public paths that don't require authentication
    const publicPaths = [
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

    const isPublicPath = publicPaths.some(
      (path) =>
        request.nextUrl.pathname === path ||
        request.nextUrl.pathname.startsWith(`${path}/`)
    );

    // Redirect to login if session missing and not public
    if (!session && !isPublicPath) {
      const redirectUrl = new URL("/auth/login", request.url);
      redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return response;
  } catch (error) {
    console.error("Error in Supabase middleware:", error);
    return response;
  }
}
