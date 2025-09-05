"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Calendar,
  Users,
  DollarSign,
  CheckSquare,
  Mail,
  Settings,
  Home,
  Gift,
  Plus,
  Utensils,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Heart,
  Sparkles,
  Crown,
  Cake,
  Music,
  Camera,
  Palette,
  Truck,
} from "lucide-react"

import { Playfair_Display, Great_Vibes, Cormorant_Garamond, Dancing_Script } from 'next/font/google'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400','600','700'] })
const greatVibes = Great_Vibes({ subsets: ['latin'], weight: '400' })
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400','700'] })
const dancingScript = Dancing_Script({ subsets: ['latin'], weight: ['400','600','700'] })

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
    name: "Dhurata në Para",
    href: "/dashboard/cash-gifts",
    icon: Gift,
  },
  {
    name: "WhatsApp",
    href: "/dashboard/whatsapp",
    icon: Sparkles,
  },
]

export function DashboardSidebar({ weddings }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div className={cn(
      "flex h-full flex-col bg-gradient-to-b from-stone-50 via-rose-50/30 to-amber-50/20 border-r border-stone-200/50 backdrop-blur-sm transition-all duration-300 relative",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Subtle decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-8 left-4 w-6 h-6">
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <circle cx="12" cy="6" r="2" fill="#E8B4CB"/>
            <circle cx="8" cy="10" r="1.5" fill="#F5E6A3"/>
            <circle cx="16" cy="14" r="1" fill="#C8A2C8"/>
          </svg>
        </div>
        <div className="absolute bottom-16 right-4 w-4 h-4">
          <svg viewBox="0 0 16 16" className="w-full h-full">
            <circle cx="8" cy="4" r="1" fill="#F0E68C"/>
            <circle cx="6" cy="8" r="0.8" fill="#E8B4CB"/>
            <circle cx="10" cy="12" r="0.6" fill="#C8A2C8"/>
          </svg>
        </div>
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between p-4 border-b border-stone-200/50">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="text-xl text-stone-700">
              ♥
            </div>
            <div>
              <span className={`${playfair.className} font-semibold text-stone-700 text-lg`}>Dasma Aktuale</span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0 hover:bg-stone-100/50 text-stone-600"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Current Wedding */}
          {weddings.length > 0 && (
            <div>
              {/* Wedding Info */}
              {!collapsed && (
                <div className="relative p-4 border-b border-stone-200/50 bg-white/30 backdrop-blur-sm">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-600" />
                      <span className={`${playfair.className} text-sm font-semibold text-stone-800`}>
                        {weddings[0].groom_name} & {weddings[0].bride_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-stone-500" />
                      <span className={`${playfair.className} text-xs text-stone-600 font-medium`}>
                        {new Date(weddings[0].wedding_date).toLocaleDateString('sq-AL', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <nav>
            {!collapsed && <h3 className={`${playfair.className} text-sm font-semibold text-stone-600 mb-3 tracking-wide`}>NAVIGIMI</h3>}
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        `${playfair.className} flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-white/60 hover:shadow-md border-2 border-stone-200/30 hover:border-stone-300/50`,
                        isActive
                          ? "bg-white/80 text-stone-800 font-semibold shadow-md border-stone-300/60 backdrop-blur-sm"
                          : "text-stone-600 hover:text-stone-800",
                        collapsed && "justify-center px-2"
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

        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="relative p-4 border-t border-stone-200/50 bg-white/20 backdrop-blur-sm">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className={cn(`${playfair.className} w-full justify-start hover:bg-white/60 text-stone-600 hover:text-stone-800 rounded-xl font-medium border-2 border-stone-200/30 hover:border-stone-300/50 hover:shadow-md transition-all duration-200`, collapsed && "justify-center px-2")}
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
