"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, AlertCircle, Smartphone, RefreshCw, MessageCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import QRCode from "react-qr-code"

interface WhatsAppStatus {
  ready: boolean
  qrCode?: string
  error?: string
  initializing?: boolean
  hasClient?: boolean
}

export function WhatsAppSetup() {
  const [status, setStatus] = useState<WhatsAppStatus>({ ready: false })
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>('')
  const { toast } = useToast()

  const checkStatus = async () => {
    console.log('🔍 UI: Checking WhatsApp status...')
    setLoading(true)
    
    try {
      const response = await fetch('/api/whatsapp/status')
      const data = await response.json()
      
      console.log('📥 UI: Received status:', data)
      setStatus(data)
      setDebugInfo(JSON.stringify(data, null, 2))
      
    } catch (error) {
      console.error('💥 UI: Failed to check WhatsApp status:', error)
      const errorStatus = { ready: false, error: 'Failed to check status' }
      setStatus(errorStatus)
      setDebugInfo(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const initializeWhatsApp = async () => {
    console.log('🚀 UI: Starting WhatsApp initialization...')
    
    try {
      const response = await fetch('/api/whatsapp/status', { method: 'POST' })
      const data = await response.json()
      
      console.log('📥 UI: Init response:', data)
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start WhatsApp')
      }

      toast({
        title: "WhatsApp u startua",
        description: "Kontrollo statusin për QR kod",
      })
      
      // Start checking status every 2 seconds for QR code
      const interval = setInterval(async () => {
        console.log('🔄 UI: Auto-checking status for QR...')
        await checkStatus()
        
        // Stop checking if we have QR or ready
        if (status.qrCode || status.ready) {
          console.log('✅ UI: Stopping auto-check - QR found or ready')
          clearInterval(interval)
        }
      }, 2000)
      
      // Stop after 30 seconds max
      setTimeout(() => {
        console.log('⏰ UI: Stopping auto-check - timeout')
        clearInterval(interval)
      }, 30000)
      
    } catch (error: any) {
      console.error('💥 UI: Init error:', error)
      toast({
        title: "Gabim",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    console.log('🎬 UI: Component mounted, checking initial status')
    checkStatus()
  }, [])

  return (
    <div className="space-y-6">
      {/* Status Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Smartphone className="h-6 w-6 text-green-600" />
          <div>
            <h3 className="font-semibold text-gray-800">Statusi i WhatsApp</h3>
            <p className="text-sm text-gray-600">Gjendja e lidhjes me WhatsApp Web</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {status.ready ? (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4 mr-1" />
              I Lidhur
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-gray-100 text-gray-800">
              <AlertCircle className="h-4 w-4 mr-1" />
              I Shkëputur
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={checkStatus}
            disabled={loading}
            className="border-green-200 hover:bg-green-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Debug Info */}
      <Card className="bg-gray-50 border border-gray-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-gray-800 mb-2">Debug Info</h4>
          <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
            {debugInfo}
          </pre>
        </CardContent>
      </Card>

      {/* QR Code Display */}
      {status.qrCode && !status.ready && (
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h4 className="font-medium text-gray-800"> QR KOD I GJENERUAR!</h4>
              <div className="bg-white p-4 rounded-lg inline-block border">
                <QRCode
                  value={status.qrCode}
                  size={200}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox={`0 0 200 200`}
                />
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>1. Hapni WhatsApp në telefon</p>
                <p>2. Menuja → WhatsApp Web</p>
                <p>3. Skanoni kodin</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No QR Code Message */}
      {!status.qrCode && !status.ready && !status.initializing && (
        <Card className="bg-yellow-50 border border-yellow-200">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-yellow-800 font-medium">Asnjë QR kod nuk u gjenerua ende</p>
            <p className="text-yellow-700 text-sm">Kliko "Lidhu me WhatsApp" për të filluar</p>
          </CardContent>
        </Card>
      )}

      {/* Connection Actions */}
      <div className="space-y-4">
        {!status.ready && !status.qrCode && (
          <Button
            onClick={initializeWhatsApp}
            disabled={status.initializing}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              {status.error ? 'Riprovo Lidhjen' : 'Lidhu me WhatsApp'}
            </div>
          </Button>
        )}
        
        {/* Force refresh button after QR scan */}
        {status.qrCode && !status.ready && (
          <Button
            onClick={checkStatus}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
          >
            <div className="flex items-center gap-2">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Kontrollo Lidhjen
            </div>
          </Button>
        )}


        {status.ready && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">WhatsApp është i lidhur!</span>
              </div>
              <p className="text-green-700 mt-1 text-sm">
                Mund të dërgoni ftesa nga numri juaj personal.
              </p>
            </CardContent>
          </Card>
        )}

        {status.error && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Gabim në lidhje</span>
              </div>
              <p className="text-red-700 mt-1 text-sm">{status.error}</p>
              <Button
                onClick={initializeWhatsApp}
                className="mt-3 bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                Riprovo me Sesion të Ri
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
