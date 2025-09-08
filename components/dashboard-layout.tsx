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
        {/* Header Card */}
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <div className="flex flex-col space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border">
                  <Icon className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {title}
                  </h1>
                  {description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {description}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {actions && (
              <div className="flex gap-3 pt-2 border-t">
                {actions}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  )
}
