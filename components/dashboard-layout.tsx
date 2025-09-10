"use client"

import { ReactNode } from "react"
import { 
  CheckSquare, 
  Users, 
  DollarSign, 
  Store, 
  Calendar, 
  Mail, 
  MapPin,
  Heart,
  Gift,
  Settings,
  Home,
  BarChart3,
  ClipboardCheck,
  CreditCard,
  LayoutGrid,
  Search
} from "lucide-react"

interface DashboardLayoutProps {
  children: ReactNode
  title: string
  icon: string
  actions?: ReactNode
  description?: string
  gradientFrom?: string
  gradientTo?: string
  gradientVia?: string
}

const iconMap = {
  'CheckSquare': CheckSquare,
  'Users': Users,
  'DollarSign': DollarSign,
  'Store': Store,
  'Calendar': Calendar,
  'Mail': Mail,
  'MapPin': MapPin,
  'Heart': Heart,
  'Gift': Gift,
  'Settings': Settings,
  'Home': Home,
  'BarChart3': BarChart3,
  'ClipboardCheck': ClipboardCheck,
  'CreditCard': CreditCard,
  'LayoutGrid': LayoutGrid,
  'Search': Search
}

export function DashboardLayout({
  children,
  title,
  icon,
  actions,
  description,
  gradientFrom,
  gradientTo,
  gradientVia
}: DashboardLayoutProps) {
  const Icon = iconMap[icon as keyof typeof iconMap] || CheckSquare

  return (
    <div className="min-h-screen bg-[var(--bg)] dark:bg-[var(--bg-dark)]">
      <div className="container mx-auto px-4 py-6">
        
        {/* Header Card */}
        <div className="glass rounded-lg density-card mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#4338CA] to-[#2563EB] rounded-lg flex items-center justify-center border border-[#4338CA]/30">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[var(--text-heading)] dark:text-[var(--text-heading-dark)]">{title}</h1>
                {description && (
                  <p className="text-sm text-[color:var(--muted-2025)] dark:text-[color:var(--muted-dark)] mt-0.5">{description}</p>
                )}
              </div>
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </div>

        {/* Main Content */}
        {children}
      </div>
    </div>
  )
}
