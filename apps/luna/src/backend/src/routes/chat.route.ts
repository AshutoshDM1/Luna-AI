import { Router } from 'express'
import http from 'http'
import { prisma } from '../db/db'
import {
  getSessions,
  createSession,
  updateSessionTitle,
  deleteSession,
  getSessionMessages,
  addMessageToSession
} from '../controllers/chat/session.controller'

const router = Router()

// Reuse HTTP Agent for connection keep-alive to Ollama
const ollamaAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 100,
  keepAliveMsecs: 1000
})

// Session CRUD & History Routes
router.get('/sessions', getSessions)
router.post('/sessions', createSession)
router.put('/sessions/:id', updateSessionTitle)
router.delete('/sessions/:id', deleteSession)
router.get('/sessions/:id/messages', getSessionMessages)
router.post('/sessions/:id/messages', addMessageToSession)

// Chat inference route - proxies streaming from local Ollama to frontend via SSE
router.post('/', (req, res) => {
  const { model = 'gemma3:4b', messages = [], systemPrompt = '', sessionId } = req.body
  console.log(
    `[backend] POST /api/chat model=${model} messages.length=${messages.length} sessionId=${sessionId}`
  )

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
  let fullAssistantResponse = ''

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
          if (content) {
            fullAssistantResponse += content
          }
          if (content || done) {
            res.write(`data: ${JSON.stringify({ content, done })}\n\n`)
          }
        } catch (e) {
          // Partial chunk, ignore
        }
      }
    })

    ollamaRes.on('end', async () => {
      console.log('[backend] Ollama response stream ended')
      if (requestAborted) return

      // Flush any remaining buffer
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer)
          if (parsed.message?.content) {
            fullAssistantResponse += parsed.message.content
            res.write(
              `data: ${JSON.stringify({ content: parsed.message.content, done: true })}\n\n`
            )
          }
        } catch (e) {}
      }

      // Save prompt and assistant response to SQLite database
      if (sessionId && messages.length > 0) {
        const lastUserMessage = messages[messages.length - 1]
        if (lastUserMessage && lastUserMessage.role === 'user') {
          try {
            await prisma.chatMessage.create({
              data: {
                sessionId,
                role: 'user',
                content: lastUserMessage.content
              }
            })
            await prisma.chatMessage.create({
              data: {
                sessionId,
                role: 'assistant',
                content: fullAssistantResponse
              }
            })
            // Update session timestamp
            await prisma.chatSession.update({
              where: { id: sessionId },
              data: { updatedAt: new Date() }
            })
            console.log(`[backend] Successfully saved messages in DB for session: ${sessionId}`)
          } catch (err: any) {
            console.error('[backend] Error saving messages to DB:', err.message)
          }
        }
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
