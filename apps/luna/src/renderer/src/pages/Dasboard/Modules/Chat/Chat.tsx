import React, { useState, useEffect, useRef } from 'react'
import {
  Paperclip,
  Globe,
  Infinity,
  ArrowUp,
  AtSign,
  X,
  MessageSquare,
  Sparkles,
  Search,
  Bot,
  Square,
  Trash2,
  Plus,
  Edit2
} from 'lucide-react'
import { MessageList } from './components/MessageList'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import ApiClient from '@/lib/apiClient'

interface ChatProps {
  assistantName: string
  model: string
  activeSessionId: string | null
  setActiveSessionId: (id: string | null) => void
  sessions: any[]
  setSessions: React.Dispatch<React.SetStateAction<any[]>>
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  loadSession: (sessionId: string) => Promise<void>
  handleCreateSession: () => Promise<void>
  handleRenameSession: (sessionId: string, newTitle: string) => Promise<void>
  handleDeleteSession: (sessionId: string) => Promise<void>
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export const Chat: React.FC<ChatProps> = ({
  assistantName,
  model,
  activeSessionId,
  setActiveSessionId,
  sessions,
  setSessions,
  messages,
  setMessages,
  loadSession,
  handleCreateSession,
  handleRenameSession,
  handleDeleteSession
}) => {
  const [inputText, setInputText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [selectedModel, setSelectedModel] = useState(model || 'gemma3:4b')
  const [chatMode, setChatMode] = useState<'agent' | 'ask'>('ask')
  const abortControllerRef = useRef<AbortController | null>(null)

  // Sync selectedModel state when prop changes
  useEffect(() => {
    if (model) {
      setSelectedModel(model)
    }
  }, [model])

  const [currentUser] = useState<any>(() => {
    try {
      const setupStr = localStorage.getItem('luna_setup')
      const userId = localStorage.getItem('luna_user_id')
      if (setupStr && userId) {
        const parsed = JSON.parse(setupStr)
        return { id: userId, name: parsed.userName }
      }
    } catch {
      return null
    }
    return null
  })

  // Save chat history mock helper (just updates local state)
  const saveHistory = (newMsgs: Message[]) => {
    setMessages(newMsgs)
  }

  const handleClearChat = async () => {
    if (confirm('Are you sure you want to clear this conversation?')) {
      if (activeSessionId) {
        await handleDeleteSession(activeSessionId)
      } else {
        setMessages([])
      }
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

    let currentSessionId = activeSessionId

    if (!currentSessionId && currentUser) {
      const sessResp = await ApiClient.post<any>('/chat/sessions', {
        userId: currentUser.id,
        title: userMsgText.split(' ').slice(0, 4).join(' ') || 'New Chat'
      })
      if (sessResp.ok && sessResp.data) {
        currentSessionId = sessResp.data.id
        setActiveSessionId(currentSessionId)
        setSessions((prev) => [sessResp.data, ...prev])
      } else {
        console.error('Failed to create session in DB')
      }
    }

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
          model: selectedModel,
          messages: updatedMessages,
          sessionId: currentSessionId
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
      let thinkingDone = false
      let buffer = ''

      outer: while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6))
              if (data.error) {
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
        const finalMsgs: Message[] = [
          ...updatedMessages,
          { role: 'assistant', content: `⚠️ Ollama error: ${errorMessage}` }
        ]
        saveHistory(finalMsgs)
        if (currentSessionId) {
          await ApiClient.post(`/chat/sessions/${currentSessionId}/messages`, {
            role: 'user',
            content: userMsgText
          })
          await ApiClient.post(`/chat/sessions/${currentSessionId}/messages`, {
            role: 'assistant',
            content: `⚠️ Ollama error: ${errorMessage}`
          })
        }
      } else if (accumulatedResponse) {
        const finalMsgs: Message[] = [
          ...updatedMessages,
          { role: 'assistant', content: accumulatedResponse }
        ]
        saveHistory(finalMsgs)

        // If first message, generate and update session title
        if (messages.length === 0 && currentSessionId) {
          const firstQueryWords = userMsgText.split(' ').slice(0, 4).join(' ')
          const generatedTitle = firstQueryWords || 'Untitled Chat'
          handleRenameSession(currentSessionId, generatedTitle)
        }
      } else {
        const content =
          '⚠️ The model returned an empty response. It may still be loading — try again in a moment.'
        const finalMsgs: Message[] = [...updatedMessages, { role: 'assistant', content }]
        saveHistory(finalMsgs)
        if (currentSessionId) {
          await ApiClient.post(`/chat/sessions/${currentSessionId}/messages`, {
            role: 'user',
            content: userMsgText
          })
          await ApiClient.post(`/chat/sessions/${currentSessionId}/messages`, {
            role: 'assistant',
            content
          })
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        if (accumulatedResponse && currentSessionId) {
          const content = accumulatedResponse + '\n\n_(generation stopped)_'
          saveHistory([...updatedMessages, { role: 'assistant', content }])
          await ApiClient.post(`/chat/sessions/${currentSessionId}/messages`, {
            role: 'user',
            content: userMsgText
          })
          await ApiClient.post(`/chat/sessions/${currentSessionId}/messages`, {
            role: 'assistant',
            content
          })
        }
      } else {
        console.error('Chat fetch error:', err)
        const content = `⚠️ Could not reach the inference backend.\n\n**Error:** ${err.message}\n\nMake sure Ollama is running and port 3001 is active.`
        saveHistory([...updatedMessages, { role: 'assistant', content }])
        if (currentSessionId) {
          await ApiClient.post(`/chat/sessions/${currentSessionId}/messages`, {
            role: 'user',
            content: userMsgText
          })
          await ApiClient.post(`/chat/sessions/${currentSessionId}/messages`, {
            role: 'assistant',
            content
          })
        }
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

  const renderInputArea = () => {
    return (
      <div className="w-full flex flex-col gap-2 pt-2">
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
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground">
                <button
                  type="button"
                  className="p-1 rounded-md hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                  title="Attach files"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Chat Mode Select (Ask / Agent) */}
                <Select
                  value={chatMode}
                  onValueChange={(val) => setChatMode(val as 'agent' | 'ask')}
                >
                  <SelectTrigger
                    className={`h-8 text-[11px] border cursor-pointer gap-1.5 flex items-center justify-between transition-all duration-300 ${
                      chatMode === 'ask'
                        ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300'
                        : 'bg-green-500/10 border-green-500/25 text-green-400 hover:bg-green-500/20 hover:text-green-300'
                    } px-2.5 w-[95px]`}
                  >
                    <div className="flex items-center gap-1.5">
                      {chatMode === 'ask' ? (
                        <MessageSquare className="w-3.5 h-3.5" />
                      ) : (
                        <Bot className="w-3.5 h-3.5" />
                      )}
                      <span>{chatMode === 'ask' ? 'Ask' : 'Agent'}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground text-[11px]">
                    <SelectItem value="ask">
                      <div className="flex items-center gap-1.5 text-indigo-400">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Ask</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="agent">
                      <div className="flex items-center gap-1.5 text-green-400">
                        <Bot className="w-3.5 h-3.5" />
                        <span>Agent</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Model Select Dropdown */}
                <Select
                  value={selectedModel}
                  onValueChange={(newModel) => {
                    setSelectedModel(newModel)
                    try {
                      const savedSetup = localStorage.getItem('luna_setup')
                      if (savedSetup) {
                        const parsed = JSON.parse(savedSetup)
                        parsed.model = newModel
                        localStorage.setItem('luna_setup', JSON.stringify(parsed))
                      }
                    } catch (err) {
                      console.error(err)
                    }
                  }}
                >
                  <SelectTrigger className="h-8 text-[11px] font-mono bg-accent/40 border-border/60 hover:bg-accent hover:text-foreground text-muted-foreground px-2.5 w-[125px] shadow-sm cursor-pointer">
                    <SelectValue placeholder="Model" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground text-[11px] font-mono">
                    <SelectItem value="gemma3:4b">gemma3:4b</SelectItem>
                    <SelectItem value="llama3">llama3</SelectItem>
                    <SelectItem value="gemma2">gemma2</SelectItem>
                    <SelectItem value="qwen2.5">qwen2.5</SelectItem>
                    <SelectItem value="phi3">phi3</SelectItem>
                  </SelectContent>
                </Select>

                {/* Research Button */}
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-2.5 hover:text-primary text-[11px] font-bold text-primary transition-all cursor-pointer h-8 shadow-sm"
                >
                  <Infinity className="w-4 h-4" />
                  <span>Research</span>
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
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-background text-foreground transition-colors duration-300 relative justify-between items-center p-6 min-h-0 overflow-hidden">
      {/* Background Horizon Glow */}
      <img
        src="/bg.png"
        alt="Glow Horizon"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl pointer-events-none select-none z-0 opacity-20 dark:opacity-40"
      />

      {/* Main Messages Container */}
      <div className="w-full max-w-5xl z-10 flex-1 flex flex-col justify-center min-h-0">
        {messages.length === 0 ? (
          /* Centered Empty State Container containing Heading + Input */
          <div className="w-full flex flex-col justify-center items-center space-y-6 my-auto animate-[fadeIn_0.3s_ease-out]">
            {/* Centered Empty State Heading */}
            <div className="text-center space-y-3">
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

            {/* Input Box rendered directly in the center */}
            <div className="w-full">{renderInputArea()}</div>
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

      {/* Input Area Bottom Dock (only rendered when conversation has messages) */}
      {messages.length > 0 && (
        <div className="w-full max-w-5xl z-10 shrink-0">{renderInputArea()}</div>
      )}
    </div>
  )
}

export default Chat
