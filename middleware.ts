import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

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

function createMiddlewareSupabaseClient(request: NextRequest) {
  const getCookie = (name: string) => request.cookies.get(name)?.value || null;

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: getCookie,
        set: () => {},    // cannot set cookies in middleware
        remove: () => {}, // cannot remove cookies in middleware
      } as any,
    }
  );
}

export async function middleware(request: NextRequest) {
  try {
    const supabase = createMiddlewareSupabaseClient(request);
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) console.error("Supabase middleware error:", error);

    const isPublicPath = PUBLIC_PATHS.some(
      (path) =>
        request.nextUrl.pathname === path ||
        request.nextUrl.pathname.startsWith(`${path}/`)
    );

    if (!session && !isPublicPath) {
      const redirectUrl = new URL("/auth/login", request.url);
      redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  } catch (err) {
    console.error("Middleware invocation failed:", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
