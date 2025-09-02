import { getWhatsAppService } from "@/lib/whatsapp"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  console.log('🌐 API GET /api/whatsapp/status called')
  
  try {
    const whatsappService = getWhatsAppService()
    const status = whatsappService.getStatus()
    
    console.log('📤 API returning status:', status)
    return Response.json(status)
  } catch (error: any) {
    console.error('💥 API GET Error:', error)
    const errorResponse = { 
      ready: false,
      initializing: false,
      error: error.message 
    }
    console.log('📤 API returning error:', errorResponse)
    return Response.json(errorResponse, { status: 500 })
  }
}

export async function POST() {
  console.log('🌐 API POST /api/whatsapp/status called - STARTING INITIALIZATION')
  
  try {
    const whatsappService = getWhatsAppService()
    
    console.log('🚀 Calling whatsappService.initialize()...')
    // Start initialization - don't await to return immediately
    whatsappService.initialize().catch((error) => {
      console.error('💥 Initialization failed in background:', error)
    })
    
    const response = { 
      message: "WhatsApp initialization started",
      success: true
    }
    
    console.log('📤 API POST returning:', response)
    return Response.json(response)
  } catch (error: any) {
    console.error('💥 API POST Error:', error)
    const errorResponse = { 
      error: error.message,
      success: false
    }
    console.log('📤 API POST returning error:', errorResponse)
    return Response.json(errorResponse, { status: 500 })
  }
}
