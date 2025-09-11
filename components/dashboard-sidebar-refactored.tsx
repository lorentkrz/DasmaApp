"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  Heart,
  Sparkles,
  Crown,
  Store,
  MessageSquare,
  BarChart3,
  FileText,
  UserCircle,
  LogOut,
  Menu,
  X
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
    icon: Home,
    color: "from-indigo-500 to-purple-600",
    badge: null
  },
  {
    name: "Mysafirët",
    href: "/dashboard/guests",
    icon: Users,
    color: "from-blue-500 to-cyan-600",
    badge: null
  },
  {
    name: "Detyrat",
    href: "/dashboard/tasks",
    icon: CheckSquare,
    color: "from-green-500 to-emerald-600",
    badge: null
  },
  {
    name: "Buxheti",
    href: "/dashboard/budget",
    icon: DollarSign,
    color: "from-amber-500 to-orange-600",
    badge: null
  },
  {
    name: "Shitësit",
    href: "/dashboard/vendors",
    icon: Store,
    color: "from-purple-500 to-pink-600",
    badge: null
  },
  {
    name: "Plani i Uljes",
    href: "/dashboard/seating",
    icon: MapPin,
    color: "from-rose-500 to-red-600",
    badge: null
  },
  {
    name: "Ftesat",
    href: "/dashboard/invitations",
    icon: Mail,
    color: "from-indigo-500 to-blue-600",
    badge: "new"
  },
  {
    name: "Dhurata",
    href: "/dashboard/cash-gifts",
    icon: Gift,
    color: "from-pink-500 to-rose-600",
    badge: null
  },
  {
    name: "WhatsApp",
    href: "/dashboard/whatsapp",
    icon: MessageSquare,
    color: "from-green-500 to-teal-600",
    badge: null
  }
]

const bottomNavigation = [
  {
    name: "Raportet",
    href: "/dashboard/reports",
    icon: BarChart3,
    color: "from-slate-500 to-gray-600"
  },
  {
    name: "Profili",
    href: "/dashboard/profile",
    icon: UserCircle,
    color: "from-blue-500 to-indigo-600"
  },
  {
    name: "Cilësimet",
    href: "/dashboard/settings",
    icon: Settings,
    color: "from-gray-500 to-slate-600"
  }
]

export function DashboardSidebarRefactored({ weddings }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  const currentWedding = weddings?.[0]
  const daysUntilWedding = currentWedding 
    ? Math.ceil((new Date(currentWedding.wedding_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Dasma App</h2>
                <p className="text-xs text-gray-500">Menaxhimi i Dasmës</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 p-0 hover:bg-gray-100 hidden lg:flex"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileOpen(false)}
            className="h-8 w-8 p-0 hover:bg-gray-100 lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Wedding Info Card */}
        {currentWedding && !collapsed && (
          <div className="px-4 pb-4">
            <Card className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 border-0">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow">
                    <Crown className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">
                      {currentWedding.groom_name} <span aria-hidden>❤</span> {currentWedding.bride_name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(currentWedding.wedding_date).toLocaleDateString('sq-AL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                {daysUntilWedding !== null && (
                  <div className="bg-white/60 rounded-lg p-2 text-center">
                    <p className="text-2xl font-bold text-purple-700">{daysUntilWedding} <span role="img" aria-label="zemra me sy">😍</span></p>
                    <p className="text-xs text-gray-600">{daysUntilWedding === 1 ? 'ditë mbetur' : 'ditë të mbetura'}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Main Navigation */}
          <div>
            {!collapsed && (
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Navigimi Kryesor
              </h3>
            )}
            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-gradient-to-r text-white shadow-lg"
                        : "hover:bg-gray-100 text-gray-700 hover:text-gray-900",
                      isActive && item.color,
                      collapsed && "justify-center px-2"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center rounded-lg p-1.5",
                      isActive ? "bg-white/20" : "bg-gray-100",
                      collapsed && "p-2"
                    )}>
                      <Icon className={cn(
                        "h-4 w-4",
                        isActive ? "text-white" : "text-gray-600"
                      )} />
                    </div>
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <Badge className="bg-red-500 text-white text-xs px-1.5 py-0">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Bottom Navigation */}
          <div>
            {!collapsed && (
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Cilësimet & Më Shumë
              </h3>
            )}
            <nav className="space-y-1">
              {bottomNavigation.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-gradient-to-r text-white shadow-lg"
                        : "hover:bg-gray-100 text-gray-700 hover:text-gray-900",
                      isActive && item.color,
                      collapsed && "justify-center px-2"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center rounded-lg p-1.5",
                      isActive ? "bg-white/20" : "bg-gray-100",
                      collapsed && "p-2"
                    )}>
                      <Icon className={cn(
                        "h-4 w-4",
                        isActive ? "text-white" : "text-gray-600"
                      )} />
                    </div>
                    {!collapsed && <span className="flex-1">{item.name}</span>}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Quick Stats */}
          {!collapsed && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Statistika të Shpejta
              </h3>
              <div className="space-y-2">
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-gray-700">Mysafirë</span>
                      </div>
                      <Badge variant="secondary">150</Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-0">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-700">Detyra</span>
                      </div>
                      <Badge variant="secondary">24</Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-0">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-amber-600" />
                        <span className="text-sm text-gray-700">Buxheti</span>
                      </div>
                      <Badge variant="secondary">€15K</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t bg-gray-50 p-4">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Dilni</span>}
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 h-10 w-10 p-0 bg-white shadow-lg lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-0 z-40 lg:hidden",
        mobileOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl">
          <SidebarContent />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex h-full flex-col bg-white border-r shadow-sm transition-all duration-300",
        collapsed ? "w-20" : "w-72"
      )}>
        <SidebarContent />
      </div>
    </>
  )
}
