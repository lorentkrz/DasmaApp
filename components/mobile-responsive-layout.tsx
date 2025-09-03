"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X } from "lucide-react"

interface MobileResponsiveLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  className?: string
}

export function MobileResponsiveLayout({ 
  children, 
  sidebar, 
  className = "" 
}: MobileResponsiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (isMobile) {
    return (
      <div className={`min-h-screen bg-gray-50 ${className}`}>
        {/* Mobile Header */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="h-full overflow-y-auto">
                {sidebar}
              </div>
            </SheetContent>
          </Sheet>
          
          <h1 className="font-semibold text-lg text-gray-800">Dashboard</h1>
          
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
        
        {/* Mobile Content */}
        <div className="px-4 py-6">
          {children}
        </div>
      </div>
    )
  }

  // Desktop layout
  return (
    <div className={`flex min-h-screen ${className}`}>
      {sidebar && (
        <div className="hidden md:flex md:w-64 md:flex-col">
          {sidebar}
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
