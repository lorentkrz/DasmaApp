"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Users,
  DollarSign,
  CheckSquare,
  Mail,
  Settings,
  Home,
  Gift,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Store,
  MessageSquare,
  BarChart3,
  UserCircle,
  LogOut,
  CreditCard
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
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Mysafirët", href: "/dashboard/guests", icon: Users },
  { name: "Detyrat", href: "/dashboard/tasks", icon: CheckSquare },
  { name: "Buxheti", href: "/dashboard/budget", icon: DollarSign },
  { name: "Shitësit", href: "/dashboard/vendors", icon: Store },
  { name: "Ulëset", href: "/dashboard/seating", icon: MapPin },
  { name: "Ftesat", href: "/dashboard/invitations", icon: Mail },
  { name: "Dhurata", href: "/dashboard/cash-gifts", icon: Gift },
  { name: "WhatsApp", href: "/dashboard/whatsapp", icon: MessageSquare },
  { name: "Cilësimet", href: "/dashboard/settings", icon: Settings }
]

export function DashboardSidebarEnterprise({ weddings }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const currentWedding = weddings?.[0]

  return (
    <div className={cn(
      "flex flex-col bg-gray-900 text-white transition-all duration-300",
      collapsed ? "w-16" : "w-72"
    )}>
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <h2 className="text-xl font-semibold">Wedding ERP</h2>
              {currentWedding && (
                <p className="text-sm text-gray-400 mt-2">
                  {currentWedding.bride_name} & {currentWedding.groom_name}
                </p>
              )}
              {/* Current Page Indicator */}
              <div className="mt-3 px-3 py-1 bg-gray-800 rounded-full">
                <p className="text-xs text-gray-300">
                  {navigation.find(item => item.href === pathname)?.name || "Dashboard"}
                </p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-white"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-2",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:text-white hover:bg-gray-800"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800 px-4 py-3",
            collapsed && "px-2"
          )}
          asChild
        >
          <Link href="/auth/logout">
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="ml-4">Dil</span>}
          </Link>
        </Button>
      </div>
    </div>
  )
}
