import type React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardSidebarEnterprise } from "@/components/dashboard-sidebar-enterprise";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    console.log("Dashboard layout: No user or auth error:", error?.message);
    redirect("/auth/login");
  }

  // Try to get profile, but don't fail if it doesn't exist
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.log("Profile fetch error (non-blocking):", profileError.message);
  }

  // Get weddings for the current user
  const { data: weddings, error: weddingsError } = await supabase
    .from("weddings")
    .select("id, bride_name, groom_name, wedding_date")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (weddingsError) {
    console.log("Weddings fetch error:", weddingsError.message);
    // If we can't fetch weddings, there might be an RLS issue
    redirect("/auth/login");
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
