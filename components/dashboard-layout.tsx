"use client"

import { ReactNode } from "react"
import { LucideIcon } from "lucide-react"

interface DashboardLayoutProps {
  children: ReactNode
  title: string
  description: string
  icon: LucideIcon
  actions?: ReactNode
  gradientFrom?: string
  gradientTo?: string
  gradientVia?: string
}

export function DashboardLayout({
  children,
  title,
  description,
  icon: Icon,
  actions,
  gradientFrom = "rose-50",
  gradientTo = "amber-50",
  gradientVia = "pink-50"
}: DashboardLayoutProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-${gradientFrom} via-${gradientVia} to-${gradientTo} relative overflow-hidden`}>
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-rose-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-amber-200/20 to-yellow-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-200/15 to-rose-200/15 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 relative z-10">
        {/* Standardized Header */}
        <div className="flex flex-col space-y-4 mb-6 md:mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg">
                <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
                {title}
              </h1>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-full px-4 md:px-6 py-2 md:py-3 shadow-lg">
              <p className="text-gray-700 font-medium text-base md:text-lg">
                {description}
              </p>
            </div>
          </div>
          {actions && (
            <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-6">
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
