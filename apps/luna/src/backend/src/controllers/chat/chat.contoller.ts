import { Request, Response } from 'express'
import { prisma } from '../../db/db'
import { webSearch } from '../../skills/web_search'
import { runTerminalCommand, runTerminalCommands } from '../../skills/terminal'
import { openApp } from '../../skills/open_app'
import { Ollama, Message, Tool } from 'ollama'
import os from 'os'

const ollamaClient = new Ollama({ host: 'http://127.0.0.1:11434' })

// ─── Native Ollama Tool Definitions ───────────────────────────────────────────
const AGENT_TOOLS: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'terminal',
      description:
        'Run terminal commands on the local machine. For complex tasks, provide commands as an array and they will run one by one in the same working directory.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'A single command to execute' },
          commands: {
            type: 'array',
            description: 'Multiple commands to execute sequentially for a complex task',
            items: { type: 'string' }
          },
          stopOnError: {
            type: 'boolean',
            description:
              'Whether to stop the queue after the first failed command. Defaults to true.'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'web_search',
      description:
        'Search the web for real-time information: weather, news, current events, documentation, prices, etc.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search query' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'open_app',
      description:
        'Open a desktop application on Windows or macOS by name. Use for apps like Chrome, Safari, Notepad, Calculator, Finder, Explorer, Spotify, VS Code, Terminal.',
      parameters: {
        type: 'object',
        properties: {
          app: { type: 'string', description: 'The application name to open' }
        },
        required: ['app']
      }
    }
  }
]

// ─── Tool Executor ─────────────────────────────────────────────────────────────
async function executeTool(
  name: string,
  args: Record<string, any>,
  sessionId: string
): Promise<string> {
  console.log(`[backend] Executing tool: "${name}"`, args)

  if (name === 'terminal' && args.command) {
    const result = await runTerminalCommand(args.command, sessionId)
    return result.output
  }

  if (name === 'terminal' && Array.isArray(args.commands)) {
    const result = await runTerminalCommands(args.commands, sessionId, {
      stopOnError: args.stopOnError !== false
    })
    return result.output
  }

  if (name === 'web_search' && args.query) {
    return await webSearch(args.query)
  }

  if (name === 'open_app' && args.app) {
    const result = await openApp(args.app)
    return result.output
  }

  return `Unknown tool: ${name}`
}

function parseTaggedToolCall(content: string): { name: string; args: Record<string, any> } | null {
  const match = content.match(/\[TOOL_CALL:\s*(\{[\s\S]*?\})\]/)
  if (!match) return null

  try {
    const parsed = JSON.parse(match[1].replace(/\\(?!["\\/bfnrtu])/g, '\\\\')) as Record<
      string,
      string
    >
    const { name, ...args } = parsed
    if (!name) return null
    return { name, args }
  } catch (err: any) {
    console.warn('[backend] Failed to parse tagged tool call:', err.message)
    return null
  }
}

// ─── Request Handler ───────────────────────────────────────────────────────────
export const handleChatRequest = async (req: Request, res: Response) => {
  const { model = 'qwen3:4b', messages = [], sessionId, mode } = req.body
  console.log(
    `[backend] POST /api/chat model=${model} messages.length=${messages.length} sessionId=${sessionId} mode=${mode}`
  )

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const abortSignal = { aborted: false }
  res.on('close', () => {
    abortSignal.aborted = true
  })

  try {
    if (mode === 'agent') {
      await runAgentLoop(model, messages, res, abortSignal, sessionId)
    } else {
      await runSimpleChat(model, messages, res, abortSignal, sessionId)
    }
  } catch (err: any) {
    if (!abortSignal.aborted) {
      const errMsg = String(err.message || '')
      // Give a helpful message for models that don't support tool calling
      if (errMsg.includes('does not support tools') || errMsg.includes('tool_choice')) {
        const helpMsg = `⚠️ **${model}** does not support native tool calling.\n\nSwitch to a model that supports tools:\n- \`qwen3:4b\` (recommended, ~2.6GB)\n- \`llama3.2:3b\` (~2GB)\n- \`qwen2.5:7b\` (~4.4GB)\n- \`llama3.1:8b\` (~4.7GB)\n\nRun: \`ollama pull qwen3:4b\``
        res.write(`data: ${JSON.stringify({ content: helpMsg, done: false })}\n\n`)
      } else {
        console.error('[backend] Chat error:', err.message)
        res.write(`data: ${JSON.stringify({ error: `Backend error: ${err.message}` })}\n\n`)
      }
    }
  } finally {
    if (!res.writableEnded) res.end()
  }
}

// ─── Simple Chat (no tools) ────────────────────────────────────────────────────
async function runSimpleChat(
  model: string,
  messages: any[],
  res: any,
  abortSignal: { aborted: boolean },
  sessionId: string | undefined
) {
  const ollamaMessages: Message[] = messages.map((m) => ({
    role: m.role as 'user' | 'assistant' | 'system',
    content: m.content,
    ...(m.images?.length
      ? {
          images: m.images.map((img: string) =>
            img.startsWith('data:image/') ? img.split(',')[1] || img : img
          )
        }
      : {})
  }))

  const stream = await ollamaClient.chat({ model, messages: ollamaMessages, stream: true })

  let fullResponse = ''
  for await (const chunk of stream) {
    if (abortSignal.aborted) break
    const text = chunk.message?.content || ''
    if (text) {
      fullResponse += text
      res.write(`data: ${JSON.stringify({ content: text, done: false })}\n\n`)
    }
  }

  await saveMessageToDb(sessionId, messages, fullResponse)
}

// ─── Agent Loop with Native Tool Calling ──────────────────────────────────────
async function runAgentLoop(
  model: string,
  originalMessages: any[],
  res: any,
  abortSignal: { aborted: boolean },
  sessionId: string | undefined
) {
  const homeDir = os.homedir()
  const username = os.userInfo().username

  // System prompt is set ONCE — not repeated every loop
  const systemContent = `You are Luna, an intelligent AI agent on Windows 11. You have access to tools. Use them when the user needs something done on their computer or needs real-time information.

SYSTEM:
- Date/Time: ${new Date().toString()}
- Username: ${username}
- Home: ${homeDir}
- Downloads: ${homeDir}\\Downloads
- Desktop: ${homeDir}\\Desktop

Use native tool calls whenever possible. If you output a text [TOOL_CALL: {...}] tag, the backend will execute it. Do not claim an app is missing unless the tool result says it could not be found.`

  // Proper conversation structure: system → (user/assistant history) → latest user
  const conversationMessages: Message[] = [
    { role: 'system', content: systemContent },
    ...originalMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: String(m.content || ''),
      ...(m.images?.length
        ? {
            images: m.images.map((img: string) =>
              img.startsWith('data:image/') ? img.split(',')[1] || img : img
            )
          }
        : {})
    }))
  ]

  let fullAssistantResponse = ''
  const MAX_LOOPS = 8

  for (let loop = 0; loop < MAX_LOOPS; loop++) {
    if (abortSignal.aborted) break
    console.log(`[backend] Agent loop ${loop + 1}, messages: ${conversationMessages.length}`)

    // ── Non-streaming call with native tools ──────────────────────────────────
    const response = await ollamaClient.chat({
      model,
      messages: conversationMessages,
      tools: AGENT_TOOLS,
      stream: false
    })

    const assistantMsg = response.message
    const toolCalls = assistantMsg.tool_calls || []
    const textContent = assistantMsg.content || ''

    // Stream any text the model produced immediately
    if (textContent) {
      fullAssistantResponse += textContent
      res.write(`data: ${JSON.stringify({ content: textContent, done: false })}\n\n`)
    }

    // No tool calls → conversation is done
    if (toolCalls.length === 0) {
      const taggedToolCall = parseTaggedToolCall(textContent)
      if (taggedToolCall) {
        const { name, args } = taggedToolCall
        const toolResult = await executeTool(name, args, sessionId || 'default')
        const resultPreview = `[TOOL_RESULT: ${JSON.stringify({ name, ...args, output: toolResult })}]\n`
        fullAssistantResponse += resultPreview
        res.write(`data: ${JSON.stringify({ content: resultPreview, done: false })}\n\n`)

        conversationMessages.push({
          role: 'assistant',
          content: textContent
        })
        conversationMessages.push({
          role: 'tool',
          content: toolResult
        })

        if (name === 'open_app') {
          const app = args.app || 'the app'
          const summary = toolResult.toLowerCase().includes('could not')
            ? `I could not open ${app}. ${toolResult}`
            : `Opened ${app}.`
          fullAssistantResponse += summary
          res.write(`data: ${JSON.stringify({ content: summary, done: false })}\n\n`)
          break
        }

        continue
      }

      console.log(`[backend] No tool calls, agent loop complete`)
      break
    }

    // Add assistant message (with tool_calls) to conversation
    conversationMessages.push(assistantMsg)

    // Execute each tool call and add result with proper 'tool' role
    for (const tc of toolCalls) {
      if (abortSignal.aborted) break

      const name = tc.function.name
      const args = (tc.function.arguments || {}) as Record<string, any>

      // Emit tool call preview to frontend
      const callPreview = `\n[TOOL_CALL: ${JSON.stringify({ name, ...args })}]\n`
      fullAssistantResponse += callPreview
      res.write(`data: ${JSON.stringify({ content: callPreview, done: false })}\n\n`)

      // Execute the tool
      const toolResult = await executeTool(name, args, sessionId || 'default')

      // Emit result preview to frontend
      const resultPreview = `[TOOL_RESULT: ${JSON.stringify({ name, ...args, output: toolResult })}]\n`
      fullAssistantResponse += resultPreview
      res.write(`data: ${JSON.stringify({ content: resultPreview, done: false })}\n\n`)

      // Add to conversation with proper 'tool' role
      // Proper structure: user → assistant (tool_calls) → tool → assistant
      conversationMessages.push({
        role: 'tool',
        content: toolResult
      })
    }
  }

  await saveMessageToDb(sessionId, originalMessages, fullAssistantResponse)
}

// ─── DB Helper ─────────────────────────────────────────────────────────────────
async function saveMessageToDb(
  sessionId: string | undefined,
  originalMessages: any[],
  fullAssistantResponse: string
) {
  if (sessionId && originalMessages.length > 0) {
    const lastUserMsg = originalMessages.filter((m: any) => m.role === 'user').pop()
    if (lastUserMsg) {
      try {
        const dbContent =
          lastUserMsg.images?.length > 0
            ? JSON.stringify({ text: lastUserMsg.content, images: lastUserMsg.images })
            : lastUserMsg.content
        await prisma.chatMessage.create({ data: { sessionId, role: 'user', content: dbContent } })
        await prisma.chatMessage.create({
          data: { sessionId, role: 'assistant', content: fullAssistantResponse }
        })
        await prisma.chatSession.update({
          where: { id: sessionId },
          data: { updatedAt: new Date() }
        })
        console.log(`[backend] Saved messages to DB for session: ${sessionId}`)
      } catch (err: any) {
        console.error('[backend] DB save error:', err.message)
      }
    }
  }
}
