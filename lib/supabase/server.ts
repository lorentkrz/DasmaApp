import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieOptions = {
  name: string;
  value: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
  path?: string;
  maxAge?: number;
  expires?: Date;
  domain?: string;
};

export function createServerClient() {
  const cookieStore = cookies();

  const getCookie = (name: string) => cookieStore.get(name)?.value || null;

  const setCookie = (
    name: string,
    value: string,
    options: Omit<CookieOptions, "name" | "value"> = {}
  ) => {
    let cookieStr = `${name}=${encodeURIComponent(value)}; path=${options.path || "/"}`;

    if (options.maxAge) cookieStr += `; max-age=${options.maxAge}`;
    if (options.expires) cookieStr += `; expires=${options.expires.toUTCString()}`;
    cookieStr += `; samesite=${options.sameSite || "lax"}`;
    if (options.secure || process.env.NODE_ENV === "production") cookieStr += `; Secure`;
    if (options.httpOnly) cookieStr += `; HttpOnly`;

    cookieStore.set({ name, value, ...options } as any);
  };

  const removeCookie = (
    name: string,
    options: Omit<CookieOptions, "name" | "value" | "maxAge"> = {}
  ) => {
    let cookieStr = `${name}=; path=${options.path || "/"}; max-age=0; expires=${new Date(
      0
    ).toUTCString()}; samesite=${options.sameSite || "lax"}${
      options.secure || process.env.NODE_ENV === "production" ? "; Secure" : ""
    }; HttpOnly`;

    cookieStore.set({ name, value: "", ...options, maxAge: 0 } as any);
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
export async function createClient() {
  return createServerClient();
}
