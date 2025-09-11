import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'
import { EventEmitter } from 'events'

class WhatsAppService extends EventEmitter {
  private client: Client | null = null
  private isReady = false
  private qrCode: string | null = null
  private isInitializing = false
  private error: string | null = null
  private sessionPath: string
  private clientId: string = 'wedding-erp-client'
  private sessionData: any = null
  private keepaliveInterval: NodeJS.Timeout | null = null

  constructor() {
    super()
    this.sessionPath = process.env.WHATSAPP_SESSION_PATH || './whatsapp-session'
    console.log('🚀 WhatsApp Service Initialized with session path:', this.sessionPath)
  }

  private async createClient() {
    if (this.client) {
      await this.destroyClient()
    }

    console.log('📱 Creating WhatsApp Client...')
    
    const isServerless = !!process.env.NETLIFY || !!process.env.VERCEL || !!process.env.AWS_REGION
    const dataPath = this.sessionPath
    
    // Configure Puppeteer options
    const puppeteerOptions: any = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-web-security',
        '--disable-extensions',
        '--disable-infobars',
        '--window-size=800,800',
      ]
    }

    // Handle serverless environments
    if (isServerless) {
      try {
        const chromium = require('@sparticuz/chromium')
        puppeteerOptions.executablePath = await chromium.executablePath()
        puppeteerOptions.args = [...puppeteerOptions.args, ...chromium.args]
        console.log('🧊 Using serverless Chromium at path:', puppeteerOptions.executablePath)
      } catch (e) {
        console.warn('⚠️ Failed to load @sparticuz/chromium, falling back to default Puppeteer launch')
      }
    } else if (process.env.CHROME_PATH) {
      puppeteerOptions.executablePath = process.env.CHROME_PATH
      console.log('🧭 Using CHROME_PATH from env:', puppeteerOptions.executablePath)
    }

    // Configure WhatsApp client
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: this.clientId,
        dataPath: dataPath,
      }),
      puppeteer: puppeteerOptions,
      webVersionCache: {
        type: 'remote',
        // Use a recent stable WhatsApp Web version to avoid version mismatch issues
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1026638415.html',
      },
      takeoverOnConflict: true,
      authTimeoutMs: 90000,
      restartOnAuthFail: true,
    })

    console.log('🎯 Setting up WhatsApp event listeners...')

    this.client?.on('qr', (qr: string) => {
      console.log('🔑 QR Code received, please scan with your phone')
      this.qrCode = qr
      this.error = null
      this.isInitializing = false
      
      // Display QR code in terminal if in development
      if (process.env.NODE_ENV === 'development') {
        qrcode.generate(qr, { small: true })
      }
      
      this.emit('qr', qr)
    })

    this.client?.on('authenticated', (session) => {
      console.log('🔓 WhatsApp client authenticated')
      this.sessionData = session
      this.emit('authenticated')
    })

    this.client?.on('auth_failure', (msg) => {
      console.error('❌ Authentication failed:', msg)
      this.error = `Authentication failed: ${msg}`
      this.isReady = false
      this.emit('auth_failure', msg)
    })

    this.client?.on('ready', () => {
      console.log('✅ WhatsApp client is READY!')
      this.isReady = true
      this.isInitializing = false
      this.qrCode = null
      this.error = null
      this.emit('ready')
      
      // Set up periodic status check after a delay
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
        await this.createClient()
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
        await this.destroyClient()
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
      if (fs.existsSync(this.sessionPath)) {
        console.log('🗑️ Clearing session data...')
        fs.rmSync(this.sessionPath, { recursive: true, force: true })
      }
    } catch (error) {
      console.log('⚠️ Could not clear session:', error)
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000))
    await this.initialize()
  }

  async destroyClient() {
    if (!this.client) return
    
    console.log('🛑 Destroying WhatsApp client...')
    this.stopKeepalive()
    
    try {
      await this.client.logout()
    } catch (error) {
      console.error('Error during logout:', error)
    }
    
    try {
      await this.client.destroy()
    } catch (error) {
      console.error('Error destroying client:', error)
    }
    
    this.client = null
    this.isReady = false
    this.isInitializing = false
    this.qrCode = null
    this.error = 'Disconnected by user'
    this.emit('disconnected')
    console.log('✅ WhatsApp client destroyed')
  }

  async disconnect() {
    console.log('🔌 Disconnecting WhatsApp client...')
    await this.destroyClient()
  }

  private startKeepalive() {
    console.log('🔄 Starting keepalive...')
    this.stopKeepalive()
    
    this.keepaliveInterval = setInterval(async () => {
      try {
        if (this.client) {
          await this.client.getState()
        }
      } catch (error) {
        console.error('Keepalive check failed:', error)
        this.error = 'Connection lost. Please reconnect.'
        this.isReady = false
        this.emit('disconnected')
        this.stopKeepalive()
      }
    }, 30000) // Check every 30 seconds
  }

  private stopKeepalive() {
    if (this.keepaliveInterval) {
      clearInterval(this.keepaliveInterval)
      this.keepaliveInterval = null
      console.log('⏹️ Keepalive stopped')
    }
  }

  public getConnectionStatus() {
    return {
      isReady: this.isReady,
      isInitializing: this.isInitializing,
      hasQrCode: !!this.qrCode,
      error: this.error,
      sessionPath: this.sessionPath
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
