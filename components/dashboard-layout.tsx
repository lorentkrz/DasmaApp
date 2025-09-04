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

interface DashboardLayoutProps {
  children: ReactNode
  title: string
  description: string
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
  description,
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
        {/* Header */}
        <div className="flex flex-col space-y-4 mb-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border">
                <Icon className="h-5 w-5 text-gray-600" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {title}
              </h1>
            </div>
            <div className="bg-gray-50 rounded-lg px-4 py-2 border">
              <p className="text-gray-700 text-sm">
                {description}
              </p>
            </div>
          </div>
          {actions && (
            <div className="flex gap-3">
              {actions}
            </div>
          )}
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  )
}
