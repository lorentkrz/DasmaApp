import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardSidebarEnterprise } from "@/components/dashboard-sidebar-enterprise";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { TopbarEnterprise } from "@/components/topbar-enterprise";

interface Wedding {
  id: string;
  bride_name: string;
  groom_name: string;
  wedding_date: string;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    redirect("/auth/login");
  }

  const { data: weddings } = await supabase
    .from("weddings")
    .select("id, bride_name, groom_name, wedding_date")
    .eq("owner_id", user.id);

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebarEnterprise weddings={weddings || []} />
      <main className="flex-1 overflow-y-auto">
        <TopbarEnterprise />
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
