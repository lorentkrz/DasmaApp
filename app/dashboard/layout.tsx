import type React from "react";
import {
  createServerClientWithRetry,
  getSafeUser,
} from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardSidebarEnterprise } from "@/components/dashboard-sidebar-enterprise";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use enhanced user fetching
  const { user, error } = await getSafeUser();

  if (error || !user) {
    console.log("Dashboard layout: Authentication failed:", {
      hasUser: !!user,
      errorMessage: error?.message,
      timestamp: new Date().toISOString(),
    });
    redirect("/auth/login?reason=auth_required");
  }

  // Use retry-enabled client for data fetching
  const supabase = await createServerClientWithRetry();

  // Try to get profile, but don't fail if it doesn't exist
  let profile = null;
  try {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      // PGRST116 is "not found" which is acceptable
      console.log("Profile fetch error (non-blocking):", {
        error: profileError.message,
        code: profileError.code,
        userId: user.id,
      });
    } else {
      profile = profileData;
    }
  } catch (profileError: any) {
    console.warn("Profile fetch failed:", profileError?.message);
  }

  // Get weddings for the current user with enhanced error handling
  let weddings = [];
  try {
    const { data: weddingsData, error: weddingsError } = await supabase
      .from("weddings")
      .select("id, bride_name, groom_name, wedding_date")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (weddingsError) {
      console.error("Weddings fetch error:", {
        error: weddingsError.message,
        code: weddingsError.code,
        userId: user.id,
        timestamp: new Date().toISOString(),
      });

      // Only redirect on specific RLS errors, not on general query failures
      if (
        weddingsError.code === "42501" ||
        weddingsError.message?.includes("RLS")
      ) {
        console.log("RLS policy violation detected, redirecting to login");
        redirect("/auth/login?reason=rls_error");
      }

      // For other errors, continue with empty weddings array
      weddings = [];
    } else {
      weddings = weddingsData || [];
    }
  } catch (weddingsError: any) {
    console.warn("Weddings query failed completely:", weddingsError?.message);
    weddings = [];
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebarEnterprise weddings={weddings || []} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
