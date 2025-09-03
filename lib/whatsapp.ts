import { Client, LocalAuth } from 'whatsapp-web.js'

class WhatsAppService {
  private client: Client | null = null
  private isReady = false
  private qrCode: string | null = null
  private isInitializing = false
  private error: string | null = null
  private keepaliveInterval: NodeJS.Timeout | null = null

  constructor() {
    console.log('🚀 WhatsApp Service Constructor Called')
  }

  private createClient() {
    console.log('📱 Creating WhatsApp Client...')
    
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: './whatsapp-session',
        clientId: 'wedding-erp-client'
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ],
        timeout: 60000
      },
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
      }
    })

    console.log('🎯 Setting up WhatsApp event listeners...')

    this.client.on('qr', (qr) => {
      console.log('🔥 QR CODE RECEIVED!')
      this.qrCode = qr
      this.error = null
      this.isInitializing = false
    })

    this.client.on('ready', () => {
      console.log('✅ WhatsApp client is READY!')
      this.isReady = true
      this.isInitializing = false
      this.qrCode = null
      this.error = null
      
      // Don't start keepalive immediately - let connection stabilize
      setTimeout(() => {
        if (this.isReady) {
          this.startKeepalive()
        }
      }, 10000) // Wait 10 seconds before starting keepalive
    })

    this.client.on('auth_failure', (msg) => {
      console.error('❌ WhatsApp authentication FAILED:', msg)
      this.error = `Auth failed: ${msg}`
      this.isInitializing = false
      this.isReady = false
    })

    this.client.on('disconnected', (reason) => {
      console.log('📱 WhatsApp Client disconnected:', reason)
      this.isReady = false
      this.qrCode = null
      this.error = 'Client disconnected: ' + reason
      this.stopKeepalive()
      
      // Auto-reconnect after disconnect
      setTimeout(() => {
        if (!this.isReady && !this.isInitializing) {
          console.log('🔄 Attempting auto-reconnect...')
          this.initialize().catch(console.error)
        }
      }, 5000)
    })

    this.client.on('loading_screen', (percent, message) => {
      console.log('⏳ Loading screen:', percent, message)
    })

    this.client.on('authenticated', () => {
      console.log('🔐 WhatsApp AUTHENTICATED!')
    })

    // Add error event listener for Puppeteer issues
    this.client.on('error', (error) => {
      console.error('💥 WhatsApp Client ERROR:', error)
      this.error = error.message
      this.isReady = false
      this.isInitializing = false
      this.stopKeepalive()
      
      if (this.client) {
        this.client.destroy().catch(console.error)
        this.client = null
      }
    })

    console.log('✨ WhatsApp Client Created Successfully')
  }

  async initialize() {
    if (this.isInitializing) {
      console.log('⚠️ Already initializing...')
      return
    }
    
    if (this.isReady) {
      console.log('✅ Already ready')
      return
    }

    console.log('🚀 Initializing WhatsApp Service...')
    this.isInitializing = true
    this.error = null
    this.qrCode = null

    try {
      if (!this.client) {
        this.createClient()
      }

      const qrTimeout = setTimeout(() => {
        if (!this.qrCode && this.isInitializing) {
          console.log('⏰ QR generation timeout')
          this.error = 'QR generation timeout'
          this.isInitializing = false
          if (this.client) {
            this.client.destroy().catch(console.error)
            this.client = null
          }
        }
      }, 20000)
      
      await this.client!.initialize()
      clearTimeout(qrTimeout)
      
    } catch (error: any) {
      console.error('💥 WhatsApp initialization ERROR:', error)
      this.error = error.message
      this.isInitializing = false
      
      if (this.client) {
        try {
          await this.client.destroy()
        } catch (destroyError) {
          console.error('Error destroying client:', destroyError)
        }
        this.client = null
      }
    }
  }

  async sendMessage(phoneNumber: string, message: string): Promise<{ success: boolean; error?: string }> {
    console.log('📤 Sending message to:', phoneNumber)
    
    if (!this.client || !this.isReady) {
      return { success: false, error: 'WhatsApp client not ready' }
    }

    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber)
      const chatId = formattedNumber + '@c.us'
      
      await this.client.sendMessage(chatId, message)
      console.log('✅ Message sent successfully!')
      return { success: true }
      
    } catch (error: any) {
      console.error('❌ Send message error:', error)
      return { success: false, error: error.message }
    }
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '')
    
    if (cleaned.startsWith('383') || cleaned.startsWith('49') || cleaned.startsWith('41')) {
      // Already has country code
    } else if (cleaned.length === 8) {
      cleaned = '383' + cleaned
    }
    
    return cleaned
  }

  async restart() {
    console.log('🔄 Restarting WhatsApp Service...')
    
    // Stop keepalive
    this.stopKeepalive()
    
    // Force kill Chrome processes
    try {
      const { exec } = require('child_process')
      exec('taskkill /f /im chrome.exe', () => {})
      exec('taskkill /f /im chromium.exe', () => {})
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.log('⚠️ Could not kill Chrome processes:', error)
    }
    
    // Clean up existing client
    if (this.client) {
      try {
        await this.client.destroy()
      } catch (error) {
        console.log('⚠️ Error destroying client:', error)
      }
      this.client = null
    }
    
    // Reset state
    this.isReady = false
    this.isInitializing = false
    this.qrCode = null
    this.error = null
    
    // Clear session data
    try {
      const fs = require('fs')
      const path = require('path')
      const sessionPath = path.join(process.cwd(), 'whatsapp-session')
      if (fs.existsSync(sessionPath)) {
        console.log('🗑️ Clearing session data...')
        fs.rmSync(sessionPath, { recursive: true, force: true })
      }
    } catch (error) {
      console.log('⚠️ Could not clear session:', error)
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000))
    await this.initialize()
  }

  private startKeepalive() {
    if (this.keepaliveInterval) {
      clearInterval(this.keepaliveInterval)
    }
    
    this.keepaliveInterval = setInterval(async () => {
      if (this.client && this.isReady) {
        try {
          // Lighter ping - just check if client exists
          const state = await this.client.getState()
          if (state !== 'CONNECTED') {
            console.log('⚠️ Client state changed:', state)
            this.isReady = false
            this.error = `Connection state: ${state}`
          }
        } catch (error) {
          console.log('⚠️ Keepalive check failed:', error)
          // Don't immediately mark as disconnected, might be temporary
        }
      }
    }, 60000) // Every 60 seconds - less aggressive
  }

  private stopKeepalive() {
    if (this.keepaliveInterval) {
      clearInterval(this.keepaliveInterval)
      this.keepaliveInterval = null
    }
  }

  async checkConnectionState(): Promise<string | null> {
    if (!this.client) return null
    try {
      return await this.client.getState()
    } catch (error) {
      return null
    }
  }

  async refreshStatus(): Promise<void> {
    if (this.client && !this.isReady && !this.isInitializing) {
      try {
        const state = await this.client.getState()
        if (state === 'CONNECTED') {
          console.log('✅ Client is actually connected, updating status')
          this.isReady = true
          this.error = null
        }
      } catch (error) {
        console.log('⚠️ Could not refresh status:', error)
      }
    }
  }

  getStatus() {
    const status = {
      ready: this.isReady,
      initializing: this.isInitializing,
      qrCode: this.qrCode,
      error: this.error,
      hasClient: this.client !== null
    }
    console.log('📊 Current WhatsApp status:', status)
    return status
  }
}

// Singleton instance - use global to persist across requests
declare global {
  var __whatsappService: WhatsAppService | undefined
}

export function getWhatsAppService(): WhatsAppService {
  if (!global.__whatsappService) {
    console.log('🔄 Creating new WhatsApp service singleton')
    global.__whatsappService = new WhatsAppService()
  } else {
    console.log('♻️ Reusing existing WhatsApp service singleton')
  }
  return global.__whatsappService
}

export { WhatsAppService }
