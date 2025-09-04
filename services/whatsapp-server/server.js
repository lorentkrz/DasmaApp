/* Simple WhatsApp microservice for VPS hosting */
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const { Client, LocalAuth } = require('whatsapp-web.js')

const PORT = process.env.PORT || 3001
const API_KEY = process.env.API_KEY || ''
const isServerless = false
const dataPath = process.env.WHATSAPP_DATA_PATH || path.resolve(__dirname, 'whatsapp-session')

let client = null
let isReady = false
let isInitializing = false
let qrCode = null
let lastError = null

async function buildPuppeteerOptions() {
  let executablePath
  let headless = true
  let args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor'
  ]

  if (process.env.CHROME_PATH) {
    executablePath = process.env.CHROME_PATH
    console.log('Using CHROME_PATH from env:', executablePath)
  }

  if (!executablePath) {
    try {
      const chromium = await import('@sparticuz/chromium')
      const chromePath = await chromium.default.executablePath()
      if (chromePath) {
        executablePath = chromePath
        args = [...chromium.default.args, ...args]
        headless = true
        console.log('Using @sparticuz/chromium at:', executablePath)
      }
    } catch (e) {
      console.warn('Could not resolve @sparticuz/chromium, relying on system Chrome or PUPPETEER_EXECUTABLE_PATH')
    }
  }

  if (process.env.PUPPETEER_EXECUTABLE_PATH && !executablePath) {
    executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
  }

  return { headless, executablePath, args, timeout: 60000 }
}

async function createClient() {
  console.log('Creating WhatsApp client...')
  const puppeteer = await buildPuppeteerOptions()

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath,
      clientId: 'wedding-erp-client'
    }),
    puppeteer,
    webVersionCache: {
      type: 'remote',
      remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
    }
  })

  client.on('qr', (qr) => {
    console.log('QR received')
    qrCode = qr
    lastError = null
    isInitializing = false
  })

  client.on('ready', () => {
    console.log('WhatsApp READY')
    isReady = true
    isInitializing = false
    qrCode = null
    lastError = null
  })

  client.on('auth_failure', (msg) => {
    console.error('Auth failure:', msg)
    lastError = `Auth failed: ${msg}`
    isInitializing = false
    isReady = false
  })

  client.on('disconnected', (reason) => {
    console.log('Client disconnected:', reason)
    isReady = false
    qrCode = null
    lastError = 'Client disconnected: ' + reason
  })

  client.on('error', (error) => {
    console.error('Client error:', error)
    lastError = error?.message || String(error)
    isReady = false
    isInitializing = false
  })

  await client.initialize()
}

async function ensureClient() {
  if (client) return
  await createClient()
}

async function restart() {
  console.log('Restarting WhatsApp service...')
  try {
    if (client) {
      try { await client.destroy() } catch {}
      client = null
    }
    // Clear session
    if (fs.existsSync(dataPath)) {
      fs.rmSync(dataPath, { recursive: true, force: true })
    }
  } catch (e) {
    console.warn('Error during restart cleanup:', e)
  }
  isReady = false
  isInitializing = false
  qrCode = null
  lastError = null
  await createClient()
}

const app = express()
app.use(cors())
app.use(bodyParser.json())

// Simple API key auth
app.use((req, res, next) => {
  if (!API_KEY) return next() // if not set, allow (for quick start); recommend setting in prod
  const key = req.header('X-API-KEY')
  if (key !== API_KEY) return res.status(401).json({ error: 'Unauthorized' })
  next()
})

app.get('/status', (req, res) => {
  res.json({
    ready: isReady,
    initializing: isInitializing,
    qrCode: qrCode || undefined,
    error: lastError || undefined,
    hasClient: !!client
  })
})

app.post('/init', async (req, res) => {
  if (isReady) return res.json({ message: 'Already ready' })
  if (isInitializing) return res.json({ message: 'Already initializing' })
  try {
    isInitializing = true
    qrCode = null
    lastError = null
    if (!client) {
      await createClient()
    } else {
      await client.initialize()
    }
    res.json({ message: 'Initialization started' })
  } catch (e) {
    isInitializing = false
    lastError = e?.message || String(e)
    res.status(500).json({ error: lastError })
  }
})

app.post('/send', async (req, res) => {
  try {
    if (!isReady || !client) return res.status(400).json({ error: 'Client not ready' })
    const { to, message } = req.body || {}
    if (!to || !message) return res.status(400).json({ error: 'to and message required' })
    const cleaned = String(to).replace(/\D/g, '')
    const chatId = `${cleaned}@c.us`
    await client.sendMessage(chatId, String(message))
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) })
  }
})

app.post('/restart', async (req, res) => {
  try {
    await restart()
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) })
  }
})

app.listen(PORT, () => {
  console.log(`WhatsApp service listening on :${PORT}`)
  console.log('Data path:', dataPath)
})
