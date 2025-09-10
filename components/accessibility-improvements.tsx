"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DensityToggle } from "@/components/ui/density-toggle"
import { 
  HelpCircle, 
  Phone, 
  MessageSquare
} from "lucide-react"

interface AccessibilityToolbarProps {
  className?: string
}

export function AccessibilityToolbar({ className = "" }: AccessibilityToolbarProps) {
  const [showHelp, setShowHelp] = useState(false)

  return (
    <>
      {/* Accessibility Toolbar */}
      <div className={`fixed top-4 right-4 z-50 flex flex-col gap-2 ${className}`}>
        {/* Help Button */}
        <Button
          onClick={() => setShowHelp(!showHelp)}
          className="group relative bg-white/90 backdrop-blur-sm hover:bg-white border border-rose-200 hover:border-rose-300 text-rose-600 hover:text-rose-700 shadow-lg hover:shadow-xl rounded-full w-11 h-11 p-0 transition-all duration-300 ease-out hover:scale-110"
          title="Ndihmë për përdorim"
        >
          <HelpCircle className="h-5 w-5 transition-transform group-hover:scale-110" />
          <div className="absolute inset-0 rounded-full bg-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Button>
        
        {/* Density Toggle */}
        <DensityToggle />
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowHelp(false)}
        >
          <Card
            className="max-w-2xl w-full max-h-[80vh] overflow-y-auto bg-white/95 backdrop-blur-xl border border-rose-100 shadow-2xl rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="border-b border-rose-100 bg-gradient-to-r from-rose-50/70 via-pink-50/50 to-rose-50/70 rounded-t-2xl px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center border border-rose-200">
                    <HelpCircle className="h-4 w-4 text-rose-600" />
                  </div>
                  <div>
                    <CardTitle className="text-rose-800 font-semibold text-lg">
                      Ndihmë për Përdorim
                    </CardTitle>
                    <p className="text-xs text-rose-600/70 mt-0.5">
                      Udhëzime dhe këshilla për aplikacionin
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHelp(false)}
                  className="text-rose-600 hover:text-white hover:bg-rose-500 rounded-full w-9 h-9 p-0 transition-all duration-200 shadow-sm hover:shadow-md"
                  title="Mbyll ndihmën"
                >
                  <span className="text-lg font-light">×</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div>
                <h3 className="font-semibold mb-4 text-lg text-gray-800">Si të përdorni aplikacionin:</h3>
                <div className="space-y-4">
                  <div className="bg-rose-50/50 rounded-lg p-4 border border-rose-100">
                    <h4 className="font-medium text-rose-700 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                      1. Menaxhimi i Mysafirëve
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-6">
                      <li>• Klikoni "Shto Mysafir" për të shtuar mysafirë të rinj</li>
                      <li>• Përdorni filtrat për të gjetur mysafirë specifik</li>
                      <li>• Klikoni butonin "Dërgo" për të dërguar ftesa në WhatsApp</li>
                      <li>• Grupimet e mysafirëve shfaqen në akordeon</li>
                    </ul>
                  </div>

                  <div className="bg-green-50/50 rounded-lg p-4 border border-green-100">
                    <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      2. Dërgimi i Ftesave
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-6">
                      <li>• Shkoni te "WhatsApp" për të lidhur llogarinë tuaj</li>
                      <li>• Skanoni kodin QR për të aktivizuar WhatsApp</li>
                      <li>• Kthehuni te mysafirët dhe klikoni "Dërgo" për çdo mysafir</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50/50 rounded-lg p-4 border border-purple-100">
                    <h4 className="font-medium text-purple-700 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      3. Plani i Uljes
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-6">
                      <li>• Shtoni tavolina të reja dhe caktoni mysafirë</li>
                      <li>• Klikoni "Printo Kartelat" për të printuar kartelat e tavolinave</li>
                      <li>• Përdorni drag & drop për të lëvizur mysafirët</li>
                    </ul>
                  </div>

                  <div className="bg-amber-50/50 rounded-lg p-4 border border-amber-100">
                    <h4 className="font-medium text-amber-700 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      4. Eksportimi/Importimi
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-6">
                      <li>• Eksportoni listën e mysafirëve në CSV</li>
                      <li>• Importoni mysafirë nga skedarë CSV</li>
                      <li>• Printoni kartelat e tavolinave për dasmën</li>
                      <li>• Përdorni "Printo Kartelat" për secilin tavolin</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-t border-rose-100 pt-4">
                <h3 className="font-semibold mb-3 text-gray-800">Kontakt për Ndihmë:</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" className="flex items-center gap-2 border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300">
                    <Phone className="h-4 w-4" />
                    +383 XX XXX XXX
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2 border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300">
                    <MessageSquare className="h-4 w-4" />
                    Dërgo Mesazh
                  </Button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-4 rounded-lg border border-rose-100">
                <h4 className="font-medium text-rose-800 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                  Këshilla për Përdorim të Lehtë:
                </h4>
                <ul className="text-sm text-rose-700 space-y-1">
                  <li>• Klikoni këtë buton "?" për ndihmë në çdo kohë</li>
                  <li>• Të gjitha butonat kanë përshkrime kur kaloni mausin mbi to</li>
                  <li>• Aplikacioni funksionon mirë në telefon dhe tablet</li>
                  <li>• Kontaktoni për ndihmë nëse keni vështirësi</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Global Styles for Accessibility */}
      <style jsx global>{`
        /* Focus indicators */
        button:focus,
        input:focus,
        select:focus,
        textarea:focus {
          outline: 3px solid #3b82f6 !important;
          outline-offset: 2px !important;
        }
        
        /* Larger touch targets for mobile */
        @media (max-width: 768px) {
          button {
            min-height: 44px !important;
            min-width: 44px !important;
          }
        }
      `}</style>
    </>
  )
}

// Hook for screen reader announcements
export function useScreenReader() {
  const announce = (message: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }
  
  return { announce }
}
