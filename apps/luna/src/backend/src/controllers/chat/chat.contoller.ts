import { Request, Response } from 'express'
import { prisma } from '../../db/db'
import { webSearch } from '../../skills/web_search'
import { runTerminalCommand, runTerminalCommands } from '../../skills/terminal'
import { openApp } from '../../skills/open_app'
import { makeNote } from '../../skills/make_note'
import { youtubeSearch } from '../../skills/youtube_search'
import { openWebsite } from '../../skills/open_website'
import { mcpManager } from '../../mcp/McpManager'
import {
  writeMemory,
  readMemories,
  searchMemories,
  getTopMemoriesSummary
} from '../../skills/memory'
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
  },
  {
    type: 'function',
    function: {
      name: 'make_note',
      description: 'Create a text note (.txt file) and open it in the default text editor.',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'The text content to save in the note' },
          folder: {
            type: 'string',
            description:
              'Optional folder path to save the note in. Defaults to the user Documents folder.'
          },
          filename: {
            type: 'string',
            description: 'Optional filename for the note (e.g., meeting_notes.txt)'
          }
        },
        required: ['content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'youtube_search',
      description: 'Open YouTube in Google Chrome and search for a specific video or topic.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search query for YouTube' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'open_website',
      description:
        'Open a specific website in Google Chrome by name or full URL (e.g., "github", "google", or "https://example.com").',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'The name of the website or the full URL to open' }
        },
        required: ['url']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'write_memory',
      description:
        'Save something to long-term memory. Use this when the user explicitly asks you to remember something, or when you encounter important personal info (name, preferences, goals, key facts) worth retaining across conversations.',
      parameters: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'The information to remember. Be concise and factual.'
          },
          tags: {
            type: 'string',
            description:
              'Optional comma-separated tags to categorise the memory, e.g. "preference,ui" or "user,name"'
          },
          importance: {
            type: 'number',
            description:
              'How important is this memory? 1 = trivial, 3 = normal, 5 = critical. Default 3.'
          }
        },
        required: ['content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'read_memory',
      description:
        'Read all memories stored so far, sorted by importance. Use when the user asks what you remember, or wants a full recall.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of memories to return. Default 50.'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_memory',
      description:
        'Search your memory by keyword to find specific stored information. Use when the user asks if you remember something specific.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The keyword or phrase to search for in memory'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return. Default 10.'
          }
        },
        required: ['query']
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

    if (name === 'make_note' && args.content) {
      const result = await makeNote(args.content, args.folder, args.filename)
      return { output: result.output, success: result.success }
    }

    if (name === 'youtube_search' && args.query) {
      const result = await youtubeSearch(args.query)
      return { output: result.output, success: result.success }
    }

    if (name === 'open_website' && args.url) {
      const result = await openWebsite(args.url)
      return { output: result.output, success: result.success }
    }

    if (name === 'write_memory' && args.content) {
      const result = await writeMemory(args.content, {
        tags: args.tags,
        importance: args.importance,
        source: 'agent'
      })
      return { output: result.output, success: result.success }
    }

    if (name === 'read_memory') {
      const result = await readMemories(args.limit)
      return { output: result.output, success: result.success }
    }

    if (name === 'search_memory' && args.query) {
      const result = await searchMemories(args.query, args.limit)
      return { output: result.output, success: result.success }
    }

    if (name.startsWith('mcp_')) {
      return await mcpManager.executeTool(name, args)
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

  // Load top memories to give the AI passive context awareness
  const memorySummary = await getTopMemoriesSummary(10)

  const systemContent = `You are Luna, an intelligent AI agent on Windows 11. You have access to native tools. 

SYSTEM:
- Date/Time: ${new Date().toString()}
- Username: ${username}
- Home: ${homeDir}
- Downloads: ${homeDir}\\Downloads
- Desktop: ${homeDir}\\Desktop

MEMORY & TOOL CALLING INSTRUCTIONS:
- If native tool calling fails or you want to be sure a tool runs, you can output a text tag in your response:
  [TOOL_CALL: {"name": "write_memory", "content": "text to remember", "tags": "optional,tags", "importance": 3}]
  [TOOL_CALL: {"name": "search_memory", "query": "search term"}]
  [TOOL_CALL: {"name": "read_memory"}]
  The backend will automatically execute these tags and feed the results back to you.

- Whenever the user tells you to remember something, or tells you a personal fact, preference, habit, or name, you MUST execute the "write_memory" tool (either natively or via the [TOOL_CALL: ...] text tag) immediately. Do not just say you noted it.
- Whenever the user asks you to recall something, asks "do you know...", asks "what do you remember about me...", or asks a question about their preferences/location/info, you MUST first run "search_memory" or "read_memory" to retrieve the information before responding.
- Passive memory context already loaded:
${memorySummary || '(No memories stored yet)'}

Use native tool calls or the [TOOL_CALL: ...] text tag format. If you output a text [TOOL_CALL: {...}] tag, the backend will execute it. Do not claim an app is missing unless the tool result says it could not be found.`

  const conversationMessages = buildConversationMessages(systemContent, originalMessages)

  let fullAssistantResponse = ''

  for (let loop = 0; loop < MAX_LOOPS; loop++) {
    if (abortSignal.aborted) break
    console.log(`[backend] Agent loop ${loop + 1}, messages: ${conversationMessages.length}`)

    // --- Streaming call with native tools ---
    // Small local models (like qwen3:4b) fail or ignore tools when 30+ tools are loaded at once.
    // We always load our core native skills, and dynamically load MCP Notion tools only if the user is asking about Notion.
    const userQuery = originalMessages
      .map((m) => String(m.content || ''))
      .join(' ')
      .toLowerCase()
    const needsNotion =
      userQuery.includes('notion') ||
      userQuery.includes('page') ||
      userQuery.includes('database') ||
      userQuery.includes('block') ||
      userQuery.includes('comment')

    const mcpTools = needsNotion ? mcpManager.getTools() : []
    const allTools = [...AGENT_TOOLS, ...mcpTools]

    const stream = await ollamaClient.chat({
      model,
      messages: conversationMessages,
      tools: allTools.length > 0 ? allTools : undefined,
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

    // --- Append the assistant turn (text only; tool_calls are tracked separately) ---
    conversationMessages.push({
      role: 'assistant',
      content: textContent || ''
    })

    // --- Execute tool calls and inject results as a single user message ---
    // Small models (qwen3:4b, llama3.2) don't reliably correlate role:'tool' messages back
    // to their calls. Injecting results as a user message is universally understood and
    // prevents the model from seeing an "unanswered" tool call and repeating it in a loop.
    const toolResultParts: string[] = []

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

      const resultBlock = `[TOOL_RESULT: ${JSON.stringify({ id: tc.id, name: tc.name, output: toolResult, success })}]\n`
      fullAssistantResponse += resultBlock
      res.write(`data: ${JSON.stringify({ content: resultBlock, done: false })}\n\n`)

      toolResultParts.push(`Tool "${tc.name}" returned:\n${toolResult}`)
    }

    // Single user message with all tool results — model will now generate its final answer
    conversationMessages.push({
      role: 'user',
      content: toolResultParts.join('\n\n')
    })
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
