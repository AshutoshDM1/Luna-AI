import { Request, Response } from 'express'
import { prisma } from '../../db/db'
import { webSearch } from '../../skills/web_search'
import { runTerminalCommand, runTerminalCommands } from '../../skills/terminal'
import { openApp } from '../../skills/open_app'
import { Ollama, Message, Tool } from 'ollama'
import os from 'os'

const ollamaClient = new Ollama({ host: 'http://127.0.0.1:11434' })

const MAX_CONTEXT_MESSAGES = 40
const MAX_LOOPS = 8

function generateId(): string {
  return `tc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

// --- Native Ollama Tool Definitions ---
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

// --- Tool Executor ---
async function executeTool(
  name: string,
  args: Record<string, any>,
  sessionId: string
): Promise<{ output: string; success: boolean }> {
  console.log(`[backend] Executing tool: "${name}"`, args)

  try {
    if (name === 'terminal' && args.command) {
      const result = await runTerminalCommand(args.command, sessionId)
      return { output: result.output, success: result.success }
    }

    if (name === 'terminal' && Array.isArray(args.commands)) {
      const result = await runTerminalCommands(args.commands, sessionId, {
        stopOnError: args.stopOnError !== false
      })
      return { output: result.output, success: result.success }
    }

    if (name === 'web_search' && args.query) {
      const output = await webSearch(args.query)
      return { output, success: true }
    }

    if (name === 'open_app' && args.app) {
      const result = await openApp(args.app)
      return { output: result.output, success: result.output.toLowerCase().includes('opened') }
    }

    return { output: `Unknown tool: ${name}`, success: false }
  } catch (err: any) {
    console.error(`[backend] Tool "${name}" execution failed:`, err.message)
    return { output: `Tool error: ${err.message}`, success: false }
  }
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

function buildConversationMessages(systemContent: string, originalMessages: any[]): Message[] {
  const mapped: Message[] = originalMessages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
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

  const all: Message[] = [{ role: 'system', content: systemContent }, ...mapped]

  if (all.length > MAX_CONTEXT_MESSAGES) {
    const systemMsg = all[0]
    const recentMessages = all.slice(-(MAX_CONTEXT_MESSAGES - 1))
    return [systemMsg, ...recentMessages]
  }

  return all
}

// --- Request Handler ---
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
      if (errMsg.includes('does not support tools') || errMsg.includes('tool_choice')) {
        const helpMsg = `Warning: **${model}** does not support native tool calling.\n\nSwitch to a model that supports tools:\n- \`qwen3:4b\` (recommended, ~2.6GB)\n- \`llama3.2:3b\` (~2GB)\n- \`qwen2.5:7b\` (~4.4GB)\n- \`llama3.1:8b\` (~4.7GB)\n\nRun: \`ollama pull qwen3:4b\``
        res.write(`data: ${JSON.stringify({ content: helpMsg, done: false })}\n\n`)
      } else {
        console.error('[backend] Chat error:', err.message)
        res.write(`data: ${JSON.stringify({ error: `Backend error: ${err.message}` })}\n\n`)
      }
    }
  } finally {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
      res.end()
    }
  }
}

// --- Simple Chat (no tools) ---
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

// --- Agent Loop with Native Tool Calling ---
async function runAgentLoop(
  model: string,
  originalMessages: any[],
  res: any,
  abortSignal: { aborted: boolean },
  sessionId: string | undefined
) {
  const homeDir = os.homedir()
  const username = os.userInfo().username
  const effectiveSessionId = sessionId || generateId()

  const systemContent = `You are Luna, an intelligent AI agent on Windows 11. You have access to tools. Use them when the user needs something done on their computer or needs real-time information.

SYSTEM:
- Date/Time: ${new Date().toString()}
- Username: ${username}
- Home: ${homeDir}
- Downloads: ${homeDir}\\Downloads
- Desktop: ${homeDir}\\Desktop

Use native tool calls whenever possible. If you output a text [TOOL_CALL: {...}] tag, the backend will execute it. Do not claim an app is missing unless the tool result says it could not be found.`

  const conversationMessages = buildConversationMessages(systemContent, originalMessages)

  let fullAssistantResponse = ''

  for (let loop = 0; loop < MAX_LOOPS; loop++) {
    if (abortSignal.aborted) break
    console.log(`[backend] Agent loop ${loop + 1}, messages: ${conversationMessages.length}`)

    // --- Streaming call with native tools ---
    const stream = await ollamaClient.chat({
      model,
      messages: conversationMessages,
      tools: AGENT_TOOLS,
      stream: true
    })

    let textContent = ''
    const nativeToolCalls: { name: string; args: Record<string, any>; id: string }[] = []

    for await (const chunk of stream) {
      if (abortSignal.aborted) break

      if (chunk.message?.content) {
        textContent += chunk.message.content
        res.write(`data: ${JSON.stringify({ content: chunk.message.content, done: false })}\n\n`)
      }

      if (chunk.message?.tool_calls) {
        for (const tc of chunk.message.tool_calls) {
          nativeToolCalls.push({
            name: tc.function.name,
            args: (tc.function.arguments || {}) as Record<string, any>,
            id: generateId()
          })
        }
      }
    }

    fullAssistantResponse += textContent

    // --- No native tool calls, check for tagged fallback ---
    if (nativeToolCalls.length === 0) {
      const taggedToolCall = parseTaggedToolCall(textContent)
      if (taggedToolCall) {
        const { name, args } = taggedToolCall
        const toolCallId = generateId()
        const { output: toolResult, success } = await executeTool(name, args, effectiveSessionId)

        const resultBlock = `[TOOL_CALL: ${JSON.stringify({ id: toolCallId, name, ...args })}]\n[TOOL_RESULT: ${JSON.stringify({ id: toolCallId, name, ...args, output: toolResult, success })}]\n`
        fullAssistantResponse += resultBlock
        res.write(`data: ${JSON.stringify({ content: resultBlock, done: false })}\n\n`)

        conversationMessages.push({ role: 'assistant', content: textContent })
        conversationMessages.push({
          role: 'user',
          content: `[TOOL_RESULT: ${JSON.stringify({ id: toolCallId, name, ...args, output: toolResult, success })}]`
        })

        continue
      }

      console.log(`[backend] No tool calls, agent loop complete`)
      break
    }

    // --- Build Ollama assistant message with tool_calls ---
    const ollamaAssistantMsg: Message = {
      role: 'assistant',
      content: textContent,
      tool_calls: nativeToolCalls.map((tc) => ({
        id: tc.id,
        function: {
          name: tc.name,
          arguments: tc.args
        }
      }))
    }
    conversationMessages.push(ollamaAssistantMsg)

    // --- Execute tool calls sequentially (terminal shares CWD) ---
    for (const tc of nativeToolCalls) {
      if (abortSignal.aborted) break

      const callBlock = `[TOOL_CALL: ${JSON.stringify({ id: tc.id, name: tc.name, ...tc.args })}]\n`
      fullAssistantResponse += callBlock
      res.write(`data: ${JSON.stringify({ content: callBlock, done: false })}\n\n`)

      const { output: toolResult, success } = await executeTool(
        tc.name,
        tc.args,
        effectiveSessionId
      )

      const resultBlock = `[TOOL_RESULT: ${JSON.stringify({ id: tc.id, name: tc.name, ...tc.args, output: toolResult, success })}]\n`
      fullAssistantResponse += resultBlock
      res.write(`data: ${JSON.stringify({ content: resultBlock, done: false })}\n\n`)

      conversationMessages.push({
        role: 'tool',
        content: JSON.stringify({
          id: tc.id,
          name: tc.name,
          ...tc.args,
          output: toolResult,
          success
        })
      })
    }
  }

  await saveMessageToDb(sessionId, originalMessages, fullAssistantResponse)
}

// --- DB Helper ---
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
