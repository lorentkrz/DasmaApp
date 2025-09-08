import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export function createServerClient(response?: NextResponse) {
  const getCookie = (name: string) => {
    if (!response) return null;
    return response.cookies.get(name)?.value || null;
  };

  const setCookie = (name: string, value: string, options: any = {}) => {
    if (!response) return;
    response.cookies.set({
      name,
      value,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      ...options,
    });
  };

  const removeCookie = (name: string, options: any = {}) => {
    if (!response) return;
    response.cookies.set({
      name,
      value: "",
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      ...options,
    });
  };

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: getCookie,
        set: setCookie,
        remove: removeCookie,
      } as any,
    }
  );
}

// Backwards compatibility
export async function createClient(response?: NextResponse) {
  return createServerClient(response);
}
