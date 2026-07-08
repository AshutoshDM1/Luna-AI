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
  Check,
  Globe
} from 'lucide-react'
import { TerminalAgent } from '@/Agents/Terminal/Terminal'

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

  // Assistant message rendering (completely borderless, clean layout)
  return (
    <div className="flex flex-col items-start w-full text-left space-y-3 animate-[fadeIn_0.2s_ease-out] py-4">
      {/* Content text */}
      <div className="leading-relaxed text-foreground font-medium text-xs sm:text-sm wrap-break-word select-text w-full">
        {isThinking ? (
          /* Animated thinking dots */
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
              // Support both new JSON format: [TOOL_CALL: {"name":"terminal",...}]
              // and legacy format: [EXECUTE_COMMAND: cmd] for backward compat
              // Use a greedy-to-last-brace pattern so nested/complex JSON works
              const TOOL_CALL_RE = /\[TOOL_CALL:\s*(\{.+?\})\]/gs
              const LEGACY_RE = /\[EXECUTE_COMMAND:([^\]]+)\]/g
              const hasNewFormat = TOOL_CALL_RE.test(content)
              const hasLegacyFormat = !hasNewFormat && LEGACY_RE.test(content)

              const parseToolCallJson = (jsonStr: string) => {
                const sanitized = jsonStr.replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
                return JSON.parse(sanitized)
              }

              if (hasNewFormat) {
                // Split on [TOOL_CALL: {...}] boundaries
                const parts = content.split(/(\[TOOL_CALL:\s*\{.+?\}\])/gs)
                return parts.map((part, i) => {
                  const tcMatch = part.match(/^\[TOOL_CALL:\s*(\{.+?\})\]$/s)
                  if (tcMatch) {
                    try {
                      const tool = parseToolCallJson(tcMatch[1]) as {
                        name: string
                        command?: string
                        commands?: string[]
                        query?: string
                        app?: string
                      }
                      if (tool.name === 'terminal' && (tool.command || tool.commands?.length)) {
                        const commandLabel = tool.commands?.length
                          ? tool.commands.join('\n')
                          : tool.command || ''
                        // Find matching TOOL_RESULT in the same message
                        const allResultsRe = /\[TOOL_RESULT:\s*(\{.+?\})\]/gs
                        let resultMatch: RegExpExecArray | null
                        let preExecutedOutput: string | undefined
                        let preExecutedSuccess = true
                        allResultsRe.lastIndex = 0
                        while ((resultMatch = allResultsRe.exec(content)) !== null) {
                          try {
                            const parsedRes = parseToolCallJson(resultMatch[1])
                            const resultCommandLabel = Array.isArray(parsedRes.commands)
                              ? parsedRes.commands.join('\n')
                              : parsedRes.command || ''
                            if (
                              parsedRes.name === 'terminal' &&
                              resultCommandLabel === commandLabel
                            ) {
                              preExecutedOutput = parsedRes.output
                              preExecutedSuccess = parsedRes.success !== false
                              break
                            }
                          } catch {}
                        }

                        return (
                          <TerminalAgent
                            key={i}
                            command={commandLabel}
                            commands={tool.commands}
                            onPermissionGranted={onPermissionGranted}
                            onCommandExecuted={onCommandExecuted}
                            isSystemBusy={isExecutingCommand}
                            onStartExecuting={onStartExecuting}
                            preExecutedOutput={preExecutedOutput}
                            preExecutedSuccess={preExecutedSuccess}
                          />
                        )
                      }
                      if (tool.name === 'web_search' && tool.query) {
                        // Find matching TOOL_RESULT in the same message
                        const allResultsRe = /\[TOOL_RESULT:\s*(\{.+?\})\]/gs
                        let resultMatch: RegExpExecArray | null
                        let preExecutedOutput: string | undefined
                        allResultsRe.lastIndex = 0
                        while ((resultMatch = allResultsRe.exec(content)) !== null) {
                          try {
                            const parsedRes = parseToolCallJson(resultMatch[1])
                            if (parsedRes.name === 'web_search' && parsedRes.query === tool.query) {
                              preExecutedOutput = parsedRes.output
                              break
                            }
                          } catch {}
                        }

                        if (preExecutedOutput) {
                          return (
                            <div
                              key={i}
                              className="flex flex-col gap-1.5 my-2 px-3 py-2 rounded-lg bg-neutral-900/60 border border-border/40 text-xs"
                            >
                              <div className="flex items-center gap-2 text-muted-foreground/70">
                                <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span>
                                  Searched web for{' '}
                                  <span className="text-indigo-300 font-medium">
                                    &ldquo;{tool.query}&rdquo;
                                  </span>
                                </span>
                              </div>
                              <div className="pl-5.5 text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans">
                                {preExecutedOutput}
                              </div>
                            </div>
                          )
                        }

                        return (
                          <div
                            key={i}
                            className="flex items-center gap-2 my-2 px-3 py-2 rounded-lg bg-neutral-900/60 border border-border/40 text-xs text-muted-foreground/70"
                          >
                            <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0 animate-pulse" />
                            <span>
                              Searching web for{' '}
                              <span className="text-indigo-300 font-medium">
                                &ldquo;{tool.query}&rdquo;
                              </span>
                              &hellip;
                            </span>
                          </div>
                        )
                      }
                      if (tool.name === 'open_app' && tool.app) {
                        const allResultsRe = /\[TOOL_RESULT:\s*(\{.+?\})\]/gs
                        let resultMatch: RegExpExecArray | null
                        let preExecutedOutput: string | undefined
                        allResultsRe.lastIndex = 0
                        while ((resultMatch = allResultsRe.exec(content)) !== null) {
                          try {
                            const parsedRes = parseToolCallJson(resultMatch[1])
                            if (parsedRes.name === 'open_app' && parsedRes.app === tool.app) {
                              preExecutedOutput = parsedRes.output
                              break
                            }
                          } catch {}
                        }

                        return (
                          <div
                            key={i}
                            className="flex flex-col gap-1.5 my-2 px-3 py-2 rounded-lg bg-neutral-900/60 border border-border/40 text-xs"
                          >
                            <div className="flex items-center gap-2 text-muted-foreground/70">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>
                                Opened{' '}
                                <span className="text-indigo-300 font-medium">{tool.app}</span>
                              </span>
                            </div>
                            {preExecutedOutput && (
                              <div className="pl-5.5 text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans">
                                {preExecutedOutput}
                              </div>
                            )}
                          </div>
                        )
                      }
                    } catch {
                      /* malformed JSON, fall through to text */
                    }
                  }
                  if (!part.trim()) return null
                  // Clean out raw tool results from the text block
                  const cleanedPart = part.replace(/\[TOOL_RESULT:\s*\{.+?\}\]/gs, '').trim()
                  if (!cleanedPart) return null
                  return (
                    <ReactMarkdown
                      key={i}
                      components={{
                        p: ({ children }) => (
                          <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-xs sm:text-sm leading-relaxed">{children}</li>
                        ),
                        h1: ({ children }) => (
                          <h1 className="text-lg font-bold mb-2 text-foreground">{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-base font-bold mb-2 text-foreground">{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-sm font-bold mb-1 text-foreground">{children}</h3>
                        ),
                        code: ({ children }) => (
                          <code className="bg-neutral-850 px-1.5 py-0.5 rounded font-mono text-[11px] text-indigo-400">
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-neutral-900/90 border border-border/60 p-3 rounded-lg overflow-x-auto my-2.5 font-mono text-xs text-foreground/90 shadow-sm leading-normal">
                            {children}
                          </pre>
                        ),
                        hr: () => null
                      }}
                    >
                      {cleanedPart}
                    </ReactMarkdown>
                  )
                })
              }

              if (hasLegacyFormat) {
                // Backward compat: old [EXECUTE_COMMAND: cmd] format
                const parts = content.split(/(\[EXECUTE_COMMAND:[^\]]+\])/g)
                return parts.map((part, i) => {
                  if (part.startsWith('[EXECUTE_COMMAND:') && part.endsWith(']')) {
                    const command = part.slice(17, -1).trim()
                    return (
                      <TerminalAgent
                        key={i}
                        command={command}
                        onPermissionGranted={onPermissionGranted}
                        onCommandExecuted={onCommandExecuted}
                        isSystemBusy={isExecutingCommand}
                        onStartExecuting={onStartExecuting}
                      />
                    )
                  }
                  return (
                    <ReactMarkdown
                      key={i}
                      components={{
                        p: ({ children }) => (
                          <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-xs sm:text-sm leading-relaxed">{children}</li>
                        ),
                        code: ({ children }) => (
                          <code className="bg-neutral-850 px-1.5 py-0.5 rounded font-mono text-[11px] text-indigo-400">
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-neutral-900/90 border border-border/60 p-3 rounded-lg overflow-x-auto my-2.5 font-mono text-xs text-foreground/90 shadow-sm leading-normal">
                            {children}
                          </pre>
                        ),
                        hr: () => null
                      }}
                    >
                      {part}
                    </ReactMarkdown>
                  )
                })
              }
              // Plain markdown fallback — no tool calls
              return (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-xs sm:text-sm leading-relaxed">{children}</li>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-lg font-bold mb-2 text-foreground">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-base font-bold mb-2 text-foreground">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm font-bold mb-1 text-foreground">{children}</h3>
                    ),
                    code: ({ children }) => (
                      <code className="bg-neutral-850 px-1.5 py-0.5 rounded font-mono text-[11px] text-indigo-400">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-neutral-900/90 border border-border/60 p-3 rounded-lg overflow-x-auto my-2.5 font-mono text-xs text-foreground/90 shadow-sm leading-normal">
                        {children}
                      </pre>
                    ),
                    hr: () => null
                  }}
                >
                  {content}
                </ReactMarkdown>
              )
            })()}
            {/* Blinking cursor only on the live streaming bubble */}
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
            {/* Action Toolbar */}
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

            {/* Suggestion Prompts */}
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
