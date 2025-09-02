import { Client, LocalAuth } from 'whatsapp-web.js'

class WhatsAppService {
  private client: Client | null = null
  private isReady = false
  private qrCode: string | null = null
  private isInitializing = false
  private error: string | null = null

  constructor() {
    console.log('🚀 WhatsApp Service Constructor Called')
    // Don't auto-initialize in constructor
  }

  private createClient() {
    console.log('📱 Creating WhatsApp Client...')
    console.log('🔧 Using bundled Chromium (no custom Chrome path)')
    
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: './whatsapp-session'
      }),
      puppeteer: {
        headless: true, // Use headless to avoid display issues
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--single-process',
          '--no-default-browser-check',
          '--disable-extensions'
        ]
      }
    })

    console.log('🎯 Setting up WhatsApp event listeners...')

    this.client.on('qr', (qr) => {
      console.log('🔥 QR CODE RECEIVED!')
      console.log('QR Length:', qr.length)
      console.log('QR Preview:', qr.substring(0, 50) + '...')
      this.qrCode = qr
      this.error = null
      this.isInitializing = false // QR received means initialization phase is done
    })

    this.client.on('ready', () => {
      console.log('✅ WhatsApp client is READY!')
      console.log('🔄 Setting ready state to true...')
      this.isReady = true
      this.isInitializing = false
      this.qrCode = null
      this.error = null
      console.log('📊 Updated status:', this.getStatus())
    })

    this.client.on('auth_failure', (msg) => {
      console.error('❌ WhatsApp authentication FAILED:', msg)
      this.error = `Auth failed: ${msg}`
      this.isInitializing = false
      this.isReady = false
    })

    this.client.on('disconnected', (reason) => {
      console.log('🔌 WhatsApp client DISCONNECTED:', reason)
      this.isReady = false
      this.isInitializing = false
      this.error = `Disconnected: ${reason}`
    })

    this.client.on('loading_screen', (percent, message) => {
      console.log('⏳ Loading screen:', percent, message)
    })

    this.client.on('authenticated', () => {
      console.log('🔐 WhatsApp AUTHENTICATED!')
    })

    // Add error event listener for Puppeteer issues
    this.client.on('error', (error) => {
      console.error('💥 WhatsApp Client Error:', error)
      this.error = `Client error: ${error.message}`
      this.isInitializing = false
    })

    console.log('✨ WhatsApp Client Created Successfully')
  }

  async initialize() {
    console.log('🎬 Initialize called - Current state:', {
      isInitializing: this.isInitializing,
      isReady: this.isReady,
      hasClient: !!this.client
    })

    if (this.isInitializing) {
      console.log('⚠️ Already initializing, skipping...')
      return
    }

    if (this.isReady) {
      console.log('✅ Already ready, skipping...')
      return
    }
    
    this.isInitializing = true
    this.qrCode = null
    this.error = null
    
    try {
      if (!this.client) {
        console.log('🔧 No client exists, creating new one...')
        this.createClient()
      }

      console.log('🚀 Starting WhatsApp client initialization...')
      
      // Set a timeout to detect if QR generation is stuck
      const qrTimeout = setTimeout(() => {
        if (!this.qrCode && this.isInitializing) {
          console.log('⏰ QR generation timeout - forcing reset')
          this.error = 'QR generation timeout - Puppeteer may have failed'
          this.isInitializing = false
        }
      }, 15000) // 15 second timeout
      
      await this.client!.initialize()
      clearTimeout(qrTimeout)
      console.log('🎉 WhatsApp client initialization completed!')
      
    } catch (error: any) {
      console.error('💥 WhatsApp initialization ERROR:', error)
      console.error('Error stack:', error.stack)
      this.error = error.message
      this.isInitializing = false
    }
  }

  async sendMessage(phoneNumber: string, message: string): Promise<{ success: boolean; error?: string }> {
    console.log('📤 Sending message to:', phoneNumber)
    
    if (!this.client || !this.isReady) {
      const errorMsg = 'WhatsApp client not ready'
      console.error('❌', errorMsg)
      return { success: false, error: errorMsg }
    }

    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber)
      const chatId = `${formattedNumber}@c.us`
      console.log('📞 Formatted number:', formattedNumber, 'Chat ID:', chatId)
      
      await this.client.sendMessage(chatId, message)
      console.log('✅ Message sent successfully!')
      return { success: true }
    } catch (error: any) {
      console.error('💥 Failed to send WhatsApp message:', error)
      return { success: false, error: error.message }
    }
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '')
    console.log('📞 Formatting phone:', phone, '→', cleaned)
    
    if (cleaned.startsWith('00')) {
      cleaned = cleaned.substring(2)
    }
    
    if (cleaned.length <= 8) {
      cleaned = '383' + cleaned
    }
    
    if (!cleaned.startsWith('383') && cleaned.length > 8) {
      // Already has country code
    } else if (cleaned.length === 8) {
      cleaned = '383' + cleaned
    }
    
    console.log('📞 Final formatted number:', cleaned)
    return cleaned
  }

  getStatus() {
    const status = {
      ready: this.isReady,
      initializing: this.isInitializing,
      qrCode: this.qrCode,
      error: this.error,
      hasClient: !!this.client
    }
    
    console.log('📊 Current WhatsApp Status:', status)
    return status
  }
}

// Singleton instance
let whatsappService: WhatsAppService | null = null

export function getWhatsAppService(): WhatsAppService {
  console.log('🏭 Getting WhatsApp Service instance...')
  if (!whatsappService) {
    console.log('🆕 Creating new WhatsApp Service instance')
    whatsappService = new WhatsAppService()
  }
  return whatsappService
}

export { WhatsAppService }
