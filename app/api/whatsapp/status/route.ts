import { getWhatsAppService } from "@/lib/whatsapp"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SERVICE_URL = process.env.WHATSAPP_SERVICE_URL
const SERVICE_KEY = process.env.WHATSAPP_SERVICE_KEY

export async function GET() {
  console.log('🌐 API GET /api/whatsapp/status called')
  
  // If external microservice configured, proxy to it
  if (SERVICE_URL) {
    try {
      const resp = await fetch(`${SERVICE_URL}/status`, {
        headers: SERVICE_KEY ? { 'X-API-KEY': SERVICE_KEY } : undefined,
        cache: 'no-store'
      })
      const data = await resp.json()
      console.log('📤 Proxy GET returning status:', data)
      return Response.json(data, { status: resp.status })
    } catch (error: any) {
      console.error('💥 Proxy GET Error:', error)
      return Response.json({ ready: false, initializing: false, error: error.message }, { status: 502 })
    }
  }

  // Fallback: use in-process service (local dev)
  try {
    const whatsappService = getWhatsAppService()
    const status = whatsappService.getStatus()
    console.log('📤 Local GET returning status:', status)
    return Response.json(status)
  } catch (error: any) {
    console.error('💥 Local GET Error:', error)
    const errorResponse = { ready: false, initializing: false, error: error.message }
    return Response.json(errorResponse, { status: 500 })
  }
}

export async function POST() {
  console.log('🌐 API POST /api/whatsapp/status called - INIT/RESET')
  
  // If external microservice configured, proxy /init to it
  if (SERVICE_URL) {
    try {
      const resp = await fetch(`${SERVICE_URL}/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(SERVICE_KEY ? { 'X-API-KEY': SERVICE_KEY } : {})
        },
        cache: 'no-store'
      })
      const data = await resp.json()
      console.log('📤 Proxy POST returning:', data)
      return Response.json(data, { status: resp.status })
    } catch (error: any) {
      console.error('💥 Proxy POST Error:', error)
      return Response.json({ error: error.message, success: false }, { status: 502 })
    }
  }

  // Fallback: use in-process service restart (local dev)
  try {
    const whatsappService = getWhatsAppService()
    console.log('🚀 Local: calling whatsappService.restart()...')
    whatsappService.restart().catch((error) => {
      console.error('💥 Restart failed in background:', error)
    })
    const response = { message: 'WhatsApp force reset initiated', success: true }
    console.log('📤 Local POST returning:', response)
    return Response.json(response)
  } catch (error: any) {
    console.error('💥 Local POST Error:', error)
    const errorResponse = { error: error.message, success: false }
    return Response.json(errorResponse, { status: 500 })
  }
}
