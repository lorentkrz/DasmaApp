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
  BarChart3
} from "lucide-react"
import { AccessibilityToolbar } from "@/components/accessibility-improvements"

interface DashboardLayoutProps {
  children: ReactNode
  title: string
  icon: string
  actions?: ReactNode
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
  'BarChart3': BarChart3
}

export function DashboardLayout({
  children,
  title,
  icon,
  actions,
  gradientFrom,
  gradientTo,
  gradientVia
}: DashboardLayoutProps) {
  const Icon = iconMap[icon as keyof typeof iconMap] || CheckSquare

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-6">
        
        {/* Header Card */}
        <div className="bg-white rounded-lg border shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border">
                <Icon className="h-5 w-5 text-gray-600" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            </div>
            {actions && <div>{actions}</div>}
          </div>
        </div>

        {/* Main Content */}
        {children}

        <AccessibilityToolbar />
      </div>
    </div>
  )
}
