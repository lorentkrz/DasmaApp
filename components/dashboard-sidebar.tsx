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
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Guests",
    href: "/dashboard/guests",
    icon: Users,
  },
  {
    name: "Tasks",
    href: "/dashboard/tasks",
    icon: CheckSquare,
  },
  {
    name: "Budget",
    href: "/dashboard/budget",
    icon: DollarSign,
  },
  {
    name: "Vendors",
    href: "/dashboard/vendors",
    icon: Heart,
  },
  {
    name: "Seating Chart",
    href: "/dashboard/seating",
    icon: MapPin,
  },
  {
    name: "Invitations",
    href: "/dashboard/invitations",
    icon: Mail,
  },
]

export function DashboardSidebar({ weddings }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div
      className={cn(
        "flex flex-col bg-card border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-primary">Wedding ERP</span>
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
              {!collapsed && <h3 className="text-sm font-medium text-muted-foreground mb-3">Current Wedding</h3>}
              <div className={cn("p-3 bg-primary/5 border border-primary/20 rounded-lg", collapsed && "p-2")}>
                {!collapsed ? (
                  <div>
                    <p className="font-medium text-sm text-balance">
                      {weddings[0].bride_name} & {weddings[0].groom_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(weddings[0].wedding_date).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <Heart className="h-4 w-4 text-primary mx-auto" />
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav>
            {!collapsed && <h3 className="text-sm font-medium text-muted-foreground mb-3">Navigation</h3>}
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
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent",
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
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button asChild variant="outline" size="sm" className="w-full justify-start bg-transparent">
                  <Link href="/dashboard/weddings/new">
                    <Plus className="h-4 w-4 mr-2" />
                    New Wedding
                  </Link>
                </Button>
                {weddings.length > 1 && (
                  <Button asChild variant="outline" size="sm" className="w-full justify-start bg-transparent">
                    <Link href="/dashboard/weddings">
                      <Calendar className="h-4 w-4 mr-2" />
                      Switch Wedding
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
            {!collapsed && <span className="ml-2">Settings</span>}
          </Link>
        </Button>
      </div>
    </div>
  )
}
