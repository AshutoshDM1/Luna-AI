import { Router } from 'express'
import http from 'http'

const router = Router()

// Reuse HTTP Agent for connection keep-alive to Ollama
const ollamaAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 100,
  keepAliveMsecs: 1000
})

// Chat inference route - proxies streaming from local Ollama to frontend via SSE
router.post('/', (req, res) => {
  const { model = 'gemma3:4b', messages = [], systemPrompt = '' } = req.body
  console.log(`[backend] POST /api/chat model=${model} messages.length=${messages.length}`)

  const ollamaMessages = [...messages]
  if (systemPrompt) {
    ollamaMessages.unshift({ role: 'system', content: systemPrompt })
  }

  const postData = JSON.stringify({
    model,
    messages: ollamaMessages,
    stream: true
  })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const options = {
    hostname: '127.0.0.1',
    port: 11434,
    path: '/api/chat',
    method: 'POST',
    agent: ollamaAgent,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }

  let requestAborted = false

  const ollamaReq = http.request(options, (ollamaRes) => {
    console.log(`[backend] Ollama response status: ${ollamaRes.statusCode}`)
    let buffer = ''

    ollamaRes.on('data', (chunk) => {
      if (requestAborted) return
      buffer += chunk.toString()
      const lines = buffer.split('\n')
      // Keep the last (potentially incomplete) line in the buffer
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const parsed = JSON.parse(line)
          if (parsed.error) {
            console.error('[backend] Ollama returned error in stream:', parsed.error)
            res.write(`data: ${JSON.stringify({ error: parsed.error })}\n\n`)
            continue
          }
          const content = parsed.message?.content || ''
          const done = parsed.done || false
          if (content || done) {
            res.write(`data: ${JSON.stringify({ content, done })}\n\n`)
          }
        } catch (e) {
          // Partial chunk, ignore
        }
      }
    })

    ollamaRes.on('end', () => {
      console.log('[backend] Ollama response stream ended')
      if (requestAborted) return
      // Flush any remaining buffer
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer)
          if (parsed.message?.content) {
            res.write(
              `data: ${JSON.stringify({ content: parsed.message.content, done: true })}\n\n`
            )
          }
        } catch (e) {}
      }
      if (!res.writableEnded) res.end()
    })
  })

  ollamaReq.on('error', (err) => {
    if (requestAborted) return
    console.error('[backend] Ollama connection error:', err.message)
    if (!res.writableEnded) {
      res.write(
        `data: ${JSON.stringify({ error: `Cannot connect to Ollama: ${err.message}` })}\n\n`
      )
      res.end()
    }
  })

  ollamaReq.setTimeout(120000, () => {
    console.warn('[backend] Ollama connection timed out after 120s')
    ollamaReq.destroy()
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: 'Request timed out after 120s' })}\n\n`)
      res.end()
    }
  })

  ollamaReq.write(postData)
  ollamaReq.end()

  // Abort the Ollama request if the client connection is closed prematurely
  res.on('close', () => {
    if (!res.writableEnded) {
      console.log('[backend] Client aborted connection prematurely')
      requestAborted = true
      ollamaReq.destroy()
    }
  })
})

export default router
