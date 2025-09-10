"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home,
  Users,
  ClipboardCheck,
  CreditCard,
  Store,
  LayoutGrid,
  Mail,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Banknote
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Wedding {
  id: string;
  bride_name: string;
  groom_name: string;
  wedding_date: string;
}

interface DashboardSidebarProps {
  weddings: Wedding[];
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Mysafirët", href: "/dashboard/guests", icon: Users },
  { name: "Detyrat", href: "/dashboard/tasks", icon: ClipboardCheck },
  { name: "Buxheti", href: "/dashboard/budget", icon: CreditCard },
  { name: "Shitësit", href: "/dashboard/vendors", icon: Store },
  { name: "Ulëset", href: "/dashboard/seating", icon: LayoutGrid },
  { name: "Ftesat", href: "/dashboard/invitations", icon: Mail },
  { name: "Dhurata", href: "/dashboard/cash-gifts", icon: Banknote },
  { name: "WhatsApp", href: "/dashboard/whatsapp", icon: WhatsAppIcon },
  { name: "Cilësimet", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebarEnterprise({
  weddings,
}: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const currentWedding = weddings?.[0];

  return (
    <div
      className={cn(
        "flex flex-col bg-[var(--sidebar-bg-dark)] text-[var(--text-dark)] border-r border-[var(--border-dark)] transition-all duration-300",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-[var(--border-dark)]">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-heading-dark)]">Dasma ERP</h2>
              {currentWedding && (
                <p className="text-sm text-[var(--text-muted-dark)] mt-2">
                  {currentWedding.bride_name} & {currentWedding.groom_name}
                </p>
              )}
              {/* Current Page Indicator */}
              {/* <div className="mt-3 px-3 py-1 bg-gray-800 rounded-full">
                <p className="text-xs text-gray-300">
                  {navigation.find((item) => item.href === pathname)?.name ||
                    "Dashboard"}
                </p>
              </div> */}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="text-[var(--text-muted-dark)] hover:bg-transparent hover:text-[var(--text-heading-dark)]"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group relative flex items-center rounded-md text-sm font-medium transition-colors mb-1 pl-3 pr-3 py-2 border border-[var(--border-dark)]",
                isActive
                  ? "text-[var(--text-heading-dark)] bg-[var(--card-bg-dark)]/40"
                  : "text-[var(--text-muted-dark)] hover:text-[var(--text-heading-dark)] hover:bg-[var(--card-bg-dark)]/30"
              )}
            >
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <span className={cn("absolute inset-y-0 left-0 w-2 rounded-l-md", isActive ? "bg-[linear-gradient(180deg,#4338CA,#2563EB)]" : "bg-transparent group-hover:bg-[linear-gradient(180deg,#4338CA,#2563EB)]/60")} />
                      <Icon className={cn(
                        "h-4 w-4 mr-0 transition-colors",
                        isActive ? "text-[var(--text-heading-dark)]" : "text-[var(--text-muted-dark)] group-hover:text-[var(--text-heading-dark)]"
                      )} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.name}</TooltipContent>
                </Tooltip>
              ) : (
                <>
                  <span className={cn("absolute inset-y-0 left-0 w-2 rounded-l-md", isActive ? "bg-[linear-gradient(180deg,#4338CA,#2563EB)]" : "bg-transparent group-hover:bg-[linear-gradient(180deg,#4338CA,#2563EB)]/60")} />
                  <Icon className={cn(
                    "h-4 w-4 mr-3 transition-colors",
                    isActive ? "text-[var(--text-heading-dark)]" : "text-[var(--text-muted-dark)] group-hover:text-[var(--text-heading-dark)]"
                  )} />
                </>
              )}
              {!collapsed && <span className="truncate">{item.name}</span>}
              {collapsed && <span className="sr-only">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-[var(--border-dark)]">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-[var(--text-muted-dark)] hover:text-[var(--text-heading-dark)] hover:bg-[var(--card-bg-dark)]/30 px-4 py-3",
            collapsed && "px-2"
          )}
          onClick={async () => {
            try {
              await fetch('/auth/logout', {
                method: 'POST',
                credentials: 'include'
              });
              window.location.href = '/auth/login';
            } catch (error) {
              // Fallback - redirect anyway
              window.location.href = '/auth/login';
            }
          }}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-4">Dil</span>}
        </Button>
      </div>
    </div>
  );
}
