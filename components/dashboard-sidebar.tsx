"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Heart,
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  CheckSquare,
  MapPin,
  Mail,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  MessageCircle,
} from "lucide-react"

interface Wedding {
  id: string
  bride_name: string
  groom_name: string
  wedding_date: string
}

interface DashboardSidebarProps {
  weddings: Wedding[]
}

const navigation = [
  {
    name: "Paneli Kryesor",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Mysafirët",
    href: "/dashboard/guests",
    icon: Users,
  },
  {
    name: "Detyrat",
    href: "/dashboard/tasks",
    icon: CheckSquare,
  },
  {
    name: "Buxheti",
    href: "/dashboard/budget",
    icon: DollarSign,
  },
  {
    name: "Contracts",
    href: "/dashboard/vendors",
    icon: Heart,
  },
  {
    name: "Plani i Uljes",
    href: "/dashboard/seating",
    icon: MapPin,
  },
  {
    name: "Ftesat",
    href: "/dashboard/invitations",
    icon: Mail,
  },
  {
    name: "WhatsApp",
    href: "/dashboard/whatsapp",
    icon: MessageCircle,
  },
]

export function DashboardSidebar({ weddings }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div
      className={cn(
        "flex flex-col bg-white border-r border-gray-200 transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-100 rounded-lg">
              <Heart className="h-5 w-5 text-rose-600" />
            </div>
            <span className="font-bold text-gray-800">Planifikuesi i Dasmave</span>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8 p-0">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Current Wedding */}
          {weddings.length > 0 && (
            <div>
              {!collapsed && <h3 className="text-sm font-medium text-gray-500 mb-3">Dasma Aktuale</h3>}
              <div className={cn("p-3 bg-rose-50 border border-rose-200 rounded-lg", collapsed && "p-2")}>
                {!collapsed ? (
                  <div>
                    <p className="font-medium text-sm text-balance text-gray-800">
                      {weddings[0].bride_name} & {weddings[0].groom_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(weddings[0].wedding_date).toLocaleDateString('sq-AL')}
                    </p>
                  </div>
                ) : (
                  <Heart className="h-4 w-4 text-rose-600 mx-auto" />
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav>
            {!collapsed && <h3 className="text-sm font-medium text-gray-500 mb-3">Navigimi</h3>}
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                        isActive
                          ? "bg-rose-600 text-white"
                          : "text-gray-600 hover:text-gray-800 hover:bg-gray-100",
                        collapsed && "justify-center px-2",
                      )}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span>{item.name}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Quick Actions */}
          {!collapsed && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Veprime të Shpejta</h3>
              <div className="space-y-2">
                <Button asChild variant="outline" size="sm" className="w-full justify-start bg-transparent">
                  <Link href="/dashboard/weddings/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Dasmë e Re
                  </Link>
                </Button>
                {weddings.length > 1 && (
                  <Button asChild variant="outline" size="sm" className="w-full justify-start bg-transparent">
                    <Link href="/dashboard/weddings">
                      <Calendar className="h-4 w-4 mr-2" />
                      Ndrysho Dasmën
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className={cn("w-full justify-start", collapsed && "justify-center px-2")}
        >
          <Link href="/dashboard/settings">
            <Settings className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Cilësimet</span>}
          </Link>
        </Button>
      </div>
    </div>
  )
}
