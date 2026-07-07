import React, { useState, useEffect, useRef } from 'react'
import {
  Paperclip,
  Globe,
  Infinity,
  ArrowUp,
  AtSign,
  ChevronDown,
  X,
  MessageSquare,
  Sparkles,
  Search,
  Bot,
  Square,
  Trash2
} from 'lucide-react'
import { MessageList } from './components/MessageList'

interface ChatProps {
  assistantName: string
  model: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export const Chat: React.FC<ChatProps> = ({ assistantName, model }) => {
  const [inputText, setInputText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('luna_chat_history')
      if (saved) {
        setMessages(JSON.parse(saved))
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  // Save chat history to localStorage
  const saveHistory = (newMsgs: Message[]) => {
    setMessages(newMsgs)
    localStorage.setItem('luna_chat_history', JSON.stringify(newMsgs))
  }

  const handleClearChat = () => {
    if (confirm('Are you sure you want to clear this conversation?')) {
      saveHistory([])
      setStreamingMessage('')
      setIsStreaming(false)
    }
  }

  const handleAbort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputText.trim() || isStreaming) return

    const userMsgText = inputText.trim()
    setInputText('')

    const updatedMessages: Message[] = [...messages, { role: 'user', content: userMsgText }]
    saveHistory(updatedMessages)

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setIsStreaming(true)
    setIsThinking(true)
    setStreamingMessage('')

    let accumulatedResponse = ''
    let errorMessage = ''

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model || 'gemma3:4b',
          messages: updatedMessages
        }),
        signal: abortController.signal
      })

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('No response body stream received.')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      // Use a local flag instead of reading stale React state inside the loop
      let thinkingDone = false
      let buffer = ''

      outer: while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        // Keep the last (potentially incomplete) line in the buffer
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6))
              if (data.error) {
                // Ollama reported an error mid-stream
                errorMessage = data.error
                setIsThinking(false)
                break outer
              } else if (data.content) {
                if (!thinkingDone) {
                  setIsThinking(false)
                  thinkingDone = true
                }
                accumulatedResponse += data.content
                setStreamingMessage(accumulatedResponse)
              }
            } catch (e) {
              console.error('SSE parsing error:', e)
            }
          }
        }
      }

      // Flush any remaining buffer
      if (buffer.trim()) {
        const trimmed = buffer.trim()
        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6))
            if (data.error) {
              errorMessage = data.error
              setIsThinking(false)
            } else if (data.content) {
              if (!thinkingDone) {
                setIsThinking(false)
                thinkingDone = true
              }
              accumulatedResponse += data.content
              setStreamingMessage(accumulatedResponse)
            }
          } catch (e) {
            console.error('SSE final parse error:', e)
          }
        }
      }

      if (errorMessage) {
        // Save the Ollama error as a visible assistant message
        saveHistory([
          ...updatedMessages,
          { role: 'assistant', content: `⚠️ Ollama error: ${errorMessage}` }
        ])
      } else if (accumulatedResponse) {
        saveHistory([...updatedMessages, { role: 'assistant', content: accumulatedResponse }])
      } else {
        // Stream ended with no content and no error (model still loading, etc.)
        saveHistory([
          ...updatedMessages,
          {
            role: 'assistant',
            content:
              '⚠️ The model returned an empty response. It may still be loading — try again in a moment.'
          }
        ])
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User aborted — save whatever was streamed so far
        if (accumulatedResponse) {
          saveHistory([
            ...updatedMessages,
            { role: 'assistant', content: accumulatedResponse + '\n\n_(generation stopped)_' }
          ])
        }
        // If nothing was streamed yet, remove the pending bubble silently
      } else {
        console.error('Chat fetch error:', err)
        saveHistory([
          ...updatedMessages,
          {
            role: 'assistant',
            content: `⚠️ Could not reach the inference backend.\n\n**Error:** ${err.message}\n\nMake sure Ollama is running and port 3001 is active.`
          }
        ])
      }
    } finally {
      setIsStreaming(false)
      setIsThinking(false)
      setStreamingMessage('')
      abortControllerRef.current = null
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-background text-foreground transition-colors duration-300 relative justify-between items-center p-6 min-h-0">
      {/* Background Horizon Glow */}
      <img
        src="/bg.png"
        alt="Glow Horizon"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl pointer-events-none select-none z-0 opacity-20 dark:opacity-40"
      />

      {/* Top Right Clear Chat Button */}
      <div className="absolute top-6 right-6 z-20">
        <button
          type="button"
          onClick={handleClearChat}
          disabled={messages.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card/40 backdrop-blur-sm text-[10px] font-semibold text-muted-foreground hover:bg-accent hover:text-destructive hover:border-destructive/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-muted-foreground disabled:hover:border-border transition-all cursor-pointer shadow-sm"
          title="Clear Conversation"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Main Messages Container */}
      <div className="w-full max-w-5xl z-10 flex-1 flex flex-col justify-center min-h-0">
        {messages.length === 0 ? (
          /* Centered Empty State Heading */
          <div className="text-center space-y-3 py-12 animate-[fadeIn_0.3s_ease-out]">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/25 flex items-center justify-center mx-auto text-indigo-500 shadow-md">
              <Bot className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Spice it up — what do you need?
              </h2>
              <p className="text-xs text-muted-foreground">
                Ask {assistantName} anything, search the web, or coordinate local tasks.
              </p>
            </div>
          </div>
        ) : (
          /* Dynamic Scrollable Chat Log */
          <div className="flex flex-col min-h-0 flex-1 justify-end pb-4">
            <MessageList
              messages={messages}
              assistantName={assistantName}
              isStreaming={isStreaming}
              isThinking={isThinking}
              streamingMessage={streamingMessage}
              onSuggestionClick={setInputText}
            />
          </div>
        )}
      </div>

      {/* Input Area Bottom Dock */}
      <div className="w-full max-w-5xl z-10 flex flex-col gap-2 pt-2 shrink-0">
        {/* Combined Chat Input Control Container */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2">
          <div className="w-full border border-border bg-card/60 backdrop-blur-md rounded-2xl p-4 shadow-lg flex flex-col gap-3">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-accent/40 text-[10px] font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-all cursor-pointer"
              >
                <AtSign className="w-3 h-3" />
                <span>Add context</span>
              </button>

              <span className="text-[10px] text-muted-foreground font-mono bg-accent/40 px-2 py-0.5 rounded-md border border-border/60">
                Brain: {model || 'gemma3:4b'}
              </span>
            </div>

            {/* Input Textarea */}
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask, search, or make anything..."
              rows={2}
              className="w-full bg-transparent border-0 resize-none outline-none text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/75 leading-relaxed"
            />

            {/* Bottom Controls Row */}
            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground">
                <button
                  type="button"
                  className="p-1 rounded-md hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                  title="Attach files"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-accent hover:text-foreground text-[10px] font-bold transition-all cursor-pointer"
                >
                  <span>Auto</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md hover:bg-accent/80 hover:text-primary text-[10px] font-bold text-primary bg-primary/10 transition-all cursor-pointer"
                >
                  <Infinity className="w-3.5 h-3.5" />
                  <span>Research</span>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-accent hover:text-foreground text-[10px] font-bold transition-all cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>All sources</span>
                </button>
              </div>

              {isStreaming ? (
                <button
                  type="button"
                  onClick={handleAbort}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer bg-red-500/90 text-white hover:bg-red-600 hover:scale-105 shadow-md shadow-red-500/30"
                  title="Stop generating"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    inputText.trim()
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:scale-105'
                      : 'bg-accent text-muted-foreground/40 cursor-not-allowed'
                  }`}
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Integration Banner Bar */}
        <div className="w-full px-4 py-2 bg-accent/20 border border-border/60 rounded-xl flex items-center justify-between text-[10px] text-muted-foreground animate-[fadeIn_0.5s_ease-out]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-indigo-500 fill-current" />
            <span>Get better answers from your apps</span>
          </div>

          <div className="flex items-center gap-3.5">
            <svg
              className="w-3 h-3 hover:scale-110 transition-transform cursor-pointer"
              viewBox="0 0 20 20"
              fill="currentColor"
              style={{ color: '#4A154B' }}
              aria-label="Slack"
            >
              <path d="M2.5 10a1.5 1.5 0 1 1 1.5 1.5H2.5V10zm1.5 1.5a1.5 1.5 0 1 1-1.5 1.5v-1.5h1.5zm0-5.25A1.5 1.5 0 1 1 5.5 8v2.25H4V6.25zm0 3.75a1.5 1.5 0 1 1 1.5-1.5H4v1.5zm12 0a1.5 1.5 0 1 1-1.5-1.5h1.5v1.5zm-1.5 1.5a1.5 1.5 0 1 1 1.5 1.5v-1.5h-1.5zm0-5.25A1.5 1.5 0 1 1 14.5 8v2.25H16V6.25zm0 3.75a1.5 1.5 0 1 1 1.5-1.5H16v1.5zm-6-3.75a1.5 1.5 0 1 1 1.5-1.5v2.25H10V6.25zm0 1.5a1.5 1.5 0 1 1 1.5-1.5H10v1.5zm0 6a1.5 1.5 0 1 1-1.5-1.5H10v1.5zm-1.5-1.5a1.5 1.5 0 1 1 1.5 1.5v-1.5H8.5z" />
            </svg>
            <Search
              className="w-3.5 h-3.5 text-red-500 hover:scale-110 transition-transform cursor-pointer"
              aria-label="Gmail"
            />
            <Globe
              className="w-3.5 h-3.5 text-emerald-500 hover:scale-110 transition-transform cursor-pointer"
              aria-label="Google Drive"
            />
            <MessageSquare
              className="w-3.5 h-3.5 text-indigo-500 hover:scale-110 transition-transform cursor-pointer"
              aria-label="Teams"
            />
            <svg
              className="w-3.5 h-3.5 hover:scale-110 transition-transform cursor-pointer text-foreground"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-label="GitHub"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            <div className="w-px h-3 bg-border/80 mx-1" />
            <button
              type="button"
              className="p-0.5 rounded-full hover:bg-accent text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chat
