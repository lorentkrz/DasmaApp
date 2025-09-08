"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
      {/* Help Button */}
      <div className={`fixed top-4 right-4 z-50 ${className}`}>
        <Button
          onClick={() => setShowHelp(!showHelp)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full w-12 h-12 p-0"
          title="Ndihmë për përdorim"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Ndihmë për Përdorim</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowHelp(false)}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3 text-lg">Si të përdorni aplikacionin:</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-blue-600 mb-2">1. Menaxhimi i Mysafirëve</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Klikoni "Shto Mysafir" për të shtuar mysafirë të rinj</li>
                      <li>• Përdorni filtrat për të gjetur mysafirë specifik</li>
                      <li>• Klikoni butonin "Dërgo" për të dërguar ftesa në WhatsApp</li>
                      <li>• Grupimet e mysafirëve shfaqen në akordeon</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-green-600 mb-2">2. Dërgimi i Ftesave</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Shkoni te "WhatsApp" për të lidhur llogarinë tuaj</li>
                      <li>• Skanoni kodin QR për të aktivizuar WhatsApp</li>
                      <li>• Kthehuni te mysafirët dhe klikoni "Dërgo" për çdo mysafir</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-purple-600 mb-2">3. Plani i Uljes</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Shtoni tavolina të reja dhe caktoni mysafirë</li>
                      <li>• Klikoni "Printo Kartelat" për të printuar kartelat e tavolinave</li>
                      <li>• Përdorni drag & drop për të lëvizur mysafirët</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-amber-600 mb-2">4. Eksportimi/Importimi</h4>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Eksportoni listën e mysafirëve në CSV</li>
                      <li>• Importoni mysafirë nga skedarë CSV</li>
                      <li>• Printoni kartelat e tavolinave për dasmën</li>
                      <li>• Përdorni "Printo Kartelat" për secilin tavolin</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Kontakt për Ndihmë:</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    +383 XX XXX XXX
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Dërgo Mesazh
                  </Button>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Këshilla për Përdorim të Lehtë:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
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
