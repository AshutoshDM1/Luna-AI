import { Router, IRouter } from 'express'
import { exec, spawn } from 'child_process'
import { join } from 'path'

const router: IRouter = Router()

// Helper to get environment PATH appended with standard Ollama install directories
const getOllamaEnv = (): NodeJS.ProcessEnv => {
  const paths: string[] = []
  if (process.platform === 'win32') {
    paths.push(join(process.env.LOCALAPPDATA || '', 'Programs', 'Ollama'))
    paths.push('C:\\Program Files\\Ollama')
  } else if (process.platform === 'darwin') {
    paths.push('/usr/local/bin')
    paths.push('/opt/homebrew/bin')
  }

  const separator = process.platform === 'win32' ? ';' : ':'
  const newPath = process.env.PATH + separator + paths.join(separator)

  return {
    ...process.env,
    PATH: newPath
  }
}

// 1. Get platform
router.get('/platform', (_req, res) => {
  res.json({ platform: process.platform })
})

// 2. Check if Ollama is installed using terminal CLI check with environment PATH injection
router.get('/check', (_req, res) => {
  exec('ollama --version', { env: getOllamaEnv() }, (err) => {
    if (err) {
      res.json({ installed: false })
    } else {
      res.json({ installed: true })
    }
  })
})

// 2b. Check if Ollama HTTP server is actively running (hits localhost:11434)
router.get('/status', async (_req, res) => {
  try {
    const http = await import('http')
    const req = http.get('http://127.0.0.1:11434/', (r) => {
      if (!res.headersSent) res.json({ running: true, statusCode: r.statusCode })
      r.resume()
    })
    req.setTimeout(2000, () => {
      req.destroy()
      if (!res.headersSent) res.json({ running: false, reason: 'timeout' })
    })
    req.on('error', () => {
      if (!res.headersSent) res.json({ running: false, reason: 'connection_refused' })
    })
  } catch {
    if (!res.headersSent) res.json({ running: false, reason: 'error' })
  }
})

// 2c. List installed Ollama models via Ollama REST API
router.get('/models', async (_req, res) => {
  try {
    const http = await import('http')
    let body = ''
    const req = http.get('http://127.0.0.1:11434/api/tags', (r) => {
      r.on('data', (chunk: Buffer) => {
        body += chunk.toString()
      })
      r.on('end', () => {
        try {
          if (!res.headersSent) res.json(JSON.parse(body))
        } catch {
          if (!res.headersSent) res.json({ models: [] })
        }
      })
    })
    req.setTimeout(3000, () => {
      req.destroy()
      if (!res.headersSent) res.json({ models: [] })
    })
    req.on('error', () => {
      if (!res.headersSent) res.json({ models: [] })
    })
  } catch {
    if (!res.headersSent) res.json({ models: [] })
  }
})

// 3. Install Ollama using terminal commands only
router.post('/install', async (_req, res) => {
  if (process.platform === 'win32') {
    // PowerShell command to run official installation script
    const psCommand = `powershell -Command "irm https://ollama.com/install.ps1 | iex"`

    exec(psCommand, (err) => {
      if (err) {
        console.error('Terminal installation error:', err)
      }
    })
    res.json({ success: true, message: 'Installing Ollama via terminal script. Please wait...' })
  } else if (process.platform === 'darwin') {
    exec('open https://ollama.com/download')
    res.json({ success: true, manual: true, message: 'Opening download link.' })
  } else {
    res.status(400).json({ success: false, message: 'Unsupported platform' })
  }
})

// 4. Pull Model via SSE spawning terminal process
router.get('/pull', (req, res) => {
  const model = req.query.model || 'gemma3:4b'

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const proc = spawn('ollama', ['pull', String(model)], { env: getOllamaEnv(), shell: true })

  let finished = false

  proc.stdout.on('data', (data) => {
    res.write(`data: ${JSON.stringify({ status: 'progress', log: data.toString().trim() })}\n\n`)
  })

  proc.stderr.on('data', (data) => {
    res.write(`data: ${JSON.stringify({ status: 'progress', log: data.toString().trim() })}\n\n`)
  })

  proc.on('close', (code) => {
    finished = true
    if (code === 0) {
      res.write(`data: ${JSON.stringify({ status: 'success' })}\n\n`)
    } else {
      res.write(`data: ${JSON.stringify({ status: 'error', log: `Exited with code ${code}` })}\n\n`)
    }
    res.end()
  })

  // Only kill the process if it hasn't already finished on its own.
  // This prevents the client closing the EventSource after a successful pull
  // from accidentally killing the next model's pull process.
  req.on('close', () => {
    if (!finished) {
      proc.kill()
    }
  })
})

export default router
