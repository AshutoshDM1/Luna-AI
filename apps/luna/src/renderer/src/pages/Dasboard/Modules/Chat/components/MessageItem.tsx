import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  Copy,
  Link2,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  MoreHorizontal,
  CornerDownRight,
  Check
} from 'lucide-react'
import { TerminalAgent } from '@/Agents/Terminal/Terminal'
import { WebSearchAgent } from '@/Agents/WebSearch/WebSearch'
import { OpenAppAgent } from '@/Agents/OpenApp/OpenApp'
import { MakeNoteAgent } from '@/Agents/MakeNote/MakeNote'
import { YoutubeSearchAgent } from '@/Agents/YoutubeSearch/YoutubeSearch'
import { OpenWebsiteAgent } from '@/Agents/OpenWebsite/OpenWebsite'
import { SetAlarmAgent } from '@/Agents/SetAlarm/SetAlarm'

interface MessageItemProps {
  role: 'user' | 'assistant' | 'system'
  content: string
  images?: string[]
  assistantName: string

  isThinking?: boolean
  isStreaming?: boolean
  onSuggestionClick?: (text: string) => void
  onPermissionGranted?: (execute: boolean) => void
  onCommandExecuted?: (command: string, success: boolean, output: string) => void
  isExecutingCommand?: boolean
  onStartExecuting?: () => void
}

interface ParsedToolCall {
  id: string
  name: string
  args: Record<string, any>
}

interface ParsedToolResult {
  id: string
  name: string
  output: string
  success: boolean
  args: Record<string, any>
}

function parseToolCallJson(jsonStr: string): Record<string, any> {
  const sanitized = jsonStr.replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
  return JSON.parse(sanitized)
}

function parseToolCallsFromContent(content: string): {
  toolCalls: Map<string, ParsedToolCall>
  toolResults: Map<string, ParsedToolResult>
  textSegments: string[]
} {
  const toolCalls = new Map<string, ParsedToolCall>()
  const toolResults = new Map<string, ParsedToolResult>()

  // Extract TOOL_CALL blocks
  const callRe = /\[TOOL_CALL:\s*(\{.+?\})\]/gs
  let match: RegExpExecArray | null
  while ((match = callRe.exec(content)) !== null) {
    try {
      const parsed = parseToolCallJson(match[1])
      if (parsed.name && parsed.id) {
        const { name, id, ...args } = parsed
        toolCalls.set(id, { id, name, args })
      }
    } catch {}
  }

  // Extract TOOL_RESULT blocks
  const resultRe = /\[TOOL_RESULT:\s*(\{.+?\})\]/gs
  while ((match = resultRe.exec(content)) !== null) {
    try {
      const parsed = parseToolCallJson(match[1])
      if (parsed.name && parsed.id) {
        const { id, name, output, success, ...rest } = parsed
        toolResults.set(id, {
          id,
          name,
          output: output || '',
          success: success !== false,
          args: rest
        })
      }
    } catch {}
  }

  // Split content into text segments (between tool blocks)
  const textSegments = content
    .split(
      /\[TOOL_CALL:\s*\{.+?\}\]\s*\[TOOL_RESULT:\s*\{.+?\}\]|\[TOOL_CALL:\s*\{.+?\}\]|\[TOOL_RESULT:\s*\{.+?\}\]/gs
    )
    .map((s) => s.trim())
    .filter(Boolean)

  return { toolCalls, toolResults, textSegments }
}

// Also support legacy format for backward compat
function parseLegacyCommand(content: string): string | null {
  const match = content.match(/\[EXECUTE_COMMAND:([^\]]+)\]/)
  return match ? match[1].trim() : null
}

const MARKDOWN_COMPONENTS = {
  p: ({ children }: any) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }: any) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
  li: ({ children }: any) => <li className="text-xs sm:text-sm leading-relaxed">{children}</li>,
  h1: ({ children }: any) => <h1 className="text-lg font-bold mb-2 text-foreground">{children}</h1>,
  h2: ({ children }: any) => (
    <h2 className="text-base font-bold mb-2 text-foreground">{children}</h2>
  ),
  h3: ({ children }: any) => <h3 className="text-sm font-bold mb-1 text-foreground">{children}</h3>,
  code: ({ children }: any) => (
    <code className="bg-neutral-850 px-1.5 py-0.5 rounded font-mono text-[11px] text-indigo-400">
      {children}
    </code>
  ),
  pre: ({ children }: any) => (
    <pre className="bg-neutral-900/90 border border-border/60 p-3 rounded-lg overflow-x-auto my-2.5 font-mono text-xs text-foreground/90 shadow-sm leading-normal">
      {children}
    </pre>
  ),
  hr: () => null
}

export const MessageItem: React.FC<MessageItemProps> = ({
  role,
  content,
  images,
  isThinking = false,
  isStreaming = false,
  onSuggestionClick,
  onPermissionGranted = () => {},
  onCommandExecuted,
  isExecutingCommand = false,
  onStartExecuting
}) => {
  const isUser = role === 'user'
  const [copied, setCopied] = useState(false)
  const [liked, setLiked] = useState<boolean | null>(null)

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isUser) {
    return (
      <div className="flex flex-col items-end w-full animate-[fadeIn_0.2s_ease-out] space-y-1.5">
        <div className="bg-neutral-800/90 text-foreground text-xs sm:text-sm px-4 py-2.5 rounded-2xl max-w-[85%] font-medium">
          {content}
        </div>
        {images && images.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1 justify-end max-w-[85%]">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt="uploaded"
                className="max-w-[200px] max-h-[150px] rounded-xl object-contain border border-border bg-neutral-900/40 shadow-sm"
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Check for legacy format
  const legacyCommand = !content.includes('[TOOL_CALL:') ? parseLegacyCommand(content) : null

  return (
    <div className="flex flex-col items-start w-full text-left space-y-3 animate-[fadeIn_0.2s_ease-out] py-4">
      <div className="leading-relaxed text-foreground font-medium text-xs sm:text-sm wrap-break-word select-text w-full">
        {isThinking ? (
          <span className="inline-flex items-center gap-1 py-1">
            <span
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </span>
        ) : (
          <div>
            {(() => {
              // ── New ID-based format ──────────────────────────────────────
              if (content.includes('[TOOL_CALL:')) {
                const { toolCalls, toolResults, textSegments } = parseToolCallsFromContent(content)

                const elements: React.ReactNode[] = []

                // Render each tool call with its matched result
                let callIndex = 0
                for (const [id, tc] of toolCalls) {
                  const result = toolResults.get(id)

                  if (tc.name === 'terminal' && (tc.args.command || tc.args.commands?.length)) {
                    const commandLabel = tc.args.commands?.length
                      ? tc.args.commands.join('\n')
                      : tc.args.command || ''
                    elements.push(
                      <TerminalAgent
                        key={`tc-${id || callIndex}`}
                        command={commandLabel}
                        commands={tc.args.commands}
                        onPermissionGranted={onPermissionGranted}
                        onCommandExecuted={onCommandExecuted}
                        isSystemBusy={isExecutingCommand}
                        onStartExecuting={onStartExecuting}
                        preExecutedOutput={result?.output}
                        preExecutedSuccess={result?.success}
                        isBackendExecuted={true}
                      />
                    )
                  } else if (tc.name === 'web_search' && tc.args.query) {
                    elements.push(
                      <WebSearchAgent
                        key={`tc-${id || callIndex}`}
                        query={tc.args.query}
                        result={result}
                      />
                    )
                  } else if (tc.name === 'open_app' && tc.args.app) {
                    elements.push(
                      <OpenAppAgent
                        key={`tc-${id || callIndex}`}
                        app={tc.args.app}
                        result={result}
                      />
                    )
                  } else if (tc.name === 'make_note') {
                    elements.push(<MakeNoteAgent key={`tc-${id || callIndex}`} result={result} />)
                  } else if (tc.name === 'youtube_search' && tc.args.query) {
                    elements.push(
                      <YoutubeSearchAgent
                        key={`tc-${id || callIndex}`}
                        query={tc.args.query}
                        result={result}
                      />
                    )
                  } else if (tc.name === 'open_website' && tc.args.url) {
                    elements.push(
                      <OpenWebsiteAgent
                        key={`tc-${id || callIndex}`}
                        url={tc.args.url}
                        result={result}
                      />
                    )
                  } else if (tc.name === 'set_alarm' && tc.args.time && tc.args.message) {
                    elements.push(
                      <SetAlarmAgent
                        key={`tc-${id || callIndex}`}
                        time={tc.args.time}
                        message={tc.args.message}
                        result={result}
                      />
                    )
                  }
                  callIndex++
                }

                // Render text segments
                for (let i = 0; i < textSegments.length; i++) {
                  const cleaned = textSegments[i].replace(/\[TOOL_RESULT:\s*\{.+?\}\]/gs, '').trim()
                  if (cleaned) {
                    elements.push(
                      <ReactMarkdown key={`text-${i}`} components={MARKDOWN_COMPONENTS}>
                        {cleaned}
                      </ReactMarkdown>
                    )
                  }
                }

                return elements.length > 0 ? elements : null
              }

              // ── Legacy format ──────────────────────────────────────────
              if (legacyCommand) {
                const parts = content.split(/(\[EXECUTE_COMMAND:[^\]]+\])/g)
                return parts.map((part, i) => {
                  if (part.startsWith('[EXECUTE_COMMAND:') && part.endsWith(']')) {
                    const cmd = part.slice(17, -1).trim()
                    return (
                      <TerminalAgent
                        key={i}
                        command={cmd}
                        onPermissionGranted={onPermissionGranted}
                        onCommandExecuted={onCommandExecuted}
                        isSystemBusy={isExecutingCommand}
                        onStartExecuting={onStartExecuting}
                      />
                    )
                  }
                  return (
                    <ReactMarkdown key={i} components={MARKDOWN_COMPONENTS}>
                      {part}
                    </ReactMarkdown>
                  )
                })
              }

              // ── Plain markdown ──────────────────────────────────────────
              return <ReactMarkdown components={MARKDOWN_COMPONENTS}>{content}</ReactMarkdown>
            })()}
            {isStreaming && (
              <span className="inline-block w-0.5 h-3.5 bg-foreground/70 ml-0.5 align-middle animate-pulse" />
            )}
          </div>
        )}
      </div>

      {content &&
        !isStreaming &&
        !content.includes('[TOOL_CALL:') &&
        !content.includes('[EXECUTE_COMMAND:') && (
          <div className="space-y-4 w-full">
            <div className="flex items-center gap-3 text-muted-foreground/60">
              <button
                onClick={handleCopy}
                className="p-1 rounded-md hover:bg-accent hover:text-foreground transition-all cursor-pointer"
                title="Copy response"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                className="p-1 rounded-md hover:bg-accent hover:text-foreground transition-all cursor-pointer"
                title="Copy link"
              >
                <Link2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setLiked(true)}
                className={`p-1 rounded-md hover:bg-accent transition-all cursor-pointer ${
                  liked === true ? 'text-indigo-500' : 'hover:text-foreground'
                }`}
                title="Good response"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setLiked(false)}
                className={`p-1 rounded-md hover:bg-accent transition-all cursor-pointer ${
                  liked === false ? 'text-red-500' : 'hover:text-foreground'
                }`}
                title="Bad response"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>

              <button
                className="p-1 rounded-md hover:bg-accent hover:text-foreground transition-all cursor-pointer"
                title="Regenerate"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                className="p-1 rounded-md hover:bg-accent hover:text-foreground transition-all cursor-pointer"
                title="More"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col gap-2 pt-1 font-sans text-xs text-muted-foreground/80">
              <button
                onClick={() => onSuggestionClick?.('Tell me about your interests')}
                className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors w-fit text-left cursor-pointer"
              >
                <CornerDownRight className="w-3 h-3 text-muted-foreground/40" />
                <span>Tell me about your interests</span>
              </button>
              <button
                onClick={() => onSuggestionClick?.('Share your hobbies or passions')}
                className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors w-fit text-left cursor-pointer"
              >
                <CornerDownRight className="w-3 h-3 text-muted-foreground/40" />
                <span>Share your hobbies or passions</span>
              </button>
            </div>
          </div>
        )}
    </div>
  )
}
