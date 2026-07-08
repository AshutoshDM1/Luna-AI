import React, { useState, useEffect, useRef } from 'react'
import {
  Paperclip,
  Infinity,
  ArrowUp,
  AtSign,
  Sparkles,
  Bot,
  Square,
  X,
  FileText,
  ImageIcon
} from 'lucide-react'
import { MessageList } from './components/MessageList'
import { SettingsModal } from '@/components/SettingsModal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import ApiClient from '@/lib/apiClient'
import { API_BASE_URL } from '@/services/api'
import { GithubIcon, NotionIcon } from '@/shared/Logos/Icons'

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
  role: 'user' | 'assistant' | 'system'
  content: string
  images?: string[]
}

export const Chat: React.FC<ChatProps> = ({
  assistantName,
  model,
  activeSessionId,
  setActiveSessionId,
  setSessions,
  messages,
  setMessages,
  handleRenameSession
}) => {
  const [inputText, setInputText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [selectedModel, setSelectedModel] = useState(model || 'gemma3:4b')
  const [chatMode, setChatMode] = useState<'agent' | 'ask'>(() => {
    return (localStorage.getItem('luna_chat_mode') as 'agent' | 'ask') || 'agent'
  })
  const [isExecutingCommand, setIsExecutingCommand] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'integrations' | 'skills'>('integrations')
  const abortControllerRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  // Always-fresh ref to messages — avoids stale closure in async callbacks
  const messagesRef = useRef<Message[]>(messages)
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Attached files state
  interface AttachedFile {
    name: string
    type: string
    dataUrl: string // base64 data URL for images, text content for txt files
    path?: string
  }
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])

  // Installed Ollama models
  const [availableModels, setAvailableModels] = useState<string[]>([])

  // Sync selectedModel state when prop changes
  useEffect(() => {
    if (model) {
      setSelectedModel(model)
    }
  }, [model])

  // Fetch installed Ollama models on mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/ollama/models`)
        if (res.ok) {
          const data = await res.json()
          const names: string[] = (data.models ?? []).map((m: any) => m.name as string)
          if (names.length > 0) {
            setAvailableModels(names)
            // Only update selectedModel if current model isn't in the list
            setSelectedModel((prev) => (names.includes(prev) ? prev : names[0]))
          }
        }
      } catch {
        // Ollama not running — keep defaults
      }
    }
    fetchModels()
  }, [])

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

  const handleAbort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const supportsVision = (modelName: string): boolean => {
    const lower = modelName.toLowerCase()
    return (
      lower.includes('vision') ||
      lower.includes('vl') ||
      lower.includes('gemma3') ||
      lower.includes('gemma')
    )
  }

  // File picker handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    for (const file of files) {
      const isImage = file.type.startsWith('image/')
      const filePath = (file as any).path || ''

      if (isImage && !supportsVision(selectedModel)) {
        alert(
          `${selectedModel} does not support vision/images. Please select a vision model (e.g. Llama 3.2 Vision or Qwen 2.5 VL) to attach images.`
        )
        continue
      }

      if (isImage) {
        const reader = new FileReader()
        reader.onload = () => {
          const img = new Image()
          img.onload = () => {
            const MAX_DIM = 800
            let width = img.width
            let height = img.height
            if (width > MAX_DIM || height > MAX_DIM) {
              if (width > height) {
                height = Math.round((height * MAX_DIM) / width)
                width = MAX_DIM
              } else {
                width = Math.round((width * MAX_DIM) / height)
                height = MAX_DIM
              }
            }
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            ctx?.drawImage(img, 0, 0, width, height)
            const resizedBase64 = canvas.toDataURL(file.type)
            setAttachedFiles((prev) => [
              ...prev,
              { name: file.name, type: file.type, dataUrl: resizedBase64, path: filePath }
            ])
          }
          img.src = reader.result as string
        }
        reader.readAsDataURL(file)
      } else {
        const reader = new FileReader()
        reader.onload = () => {
          setAttachedFiles((prev) => [
            ...prev,
            { name: file.name, type: file.type, dataUrl: reader.result as string, path: filePath }
          ])
        }
        reader.readAsDataURL(file)
      }
    }
    // Reset so same file can be re-selected
    e.target.value = ''
  }

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAgentFeedback = async (feedbackContent: string) => {
    let currentSessionId = activeSessionId
    if (!currentSessionId) return

    try {
      await ApiClient.post(`/chat/sessions/${currentSessionId}/messages`, {
        role: 'system',
        content: feedbackContent
      })
    } catch (err) {
      console.error('Failed to save agent feedback message:', err)
    }

    const updatedMessages: Message[] = [
      ...messagesRef.current,
      { role: 'system', content: feedbackContent }
    ]
    setMessages(updatedMessages)

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setIsStreaming(true)
    setIsThinking(true)
    setStreamingMessage('')

    let accumulatedResponse = ''
    let errorMessage = ''

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: updatedMessages,
          sessionId: currentSessionId,
          mode: chatMode
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
              } else if (data.done) {
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
            } else if (!data.done && data.content) {
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
        setMessages(finalMsgs)
        await ApiClient.post(`/chat/sessions/${currentSessionId}/messages`, {
          role: 'assistant',
          content: `⚠️ Ollama error: ${errorMessage}`
        })
      } else if (accumulatedResponse) {
        const finalMsgs: Message[] = [
          ...updatedMessages,
          { role: 'assistant', content: accumulatedResponse }
        ]
        setMessages(finalMsgs)
        await ApiClient.post(`/chat/sessions/${currentSessionId}/messages`, {
          role: 'assistant',
          content: accumulatedResponse
        })
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        if (accumulatedResponse) {
          const content = accumulatedResponse + '\n\n_(generation stopped)_'
          setMessages([...updatedMessages, { role: 'assistant', content }])
          await ApiClient.post(`/chat/sessions/${currentSessionId}/messages`, {
            role: 'assistant',
            content
          })
        }
      } else {
        console.error('Agent loop fetch error:', err)
        const content = `⚠️ Could not reach the inference backend.\n**Error:** ${err.message}`
        setMessages([...updatedMessages, { role: 'assistant', content }])
        await ApiClient.post(`/chat/sessions/${currentSessionId}/messages`, {
          role: 'assistant',
          content
        })
      }
    } finally {
      setIsStreaming(false)
      setIsThinking(false)
      setStreamingMessage('')
      abortControllerRef.current = null
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputText.trim() || isStreaming) return

    const currentImages = attachedFiles
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => file.dataUrl)

    const otherFiles = attachedFiles.filter((file) => !file.type.startsWith('image/'))
    const filePaths = otherFiles.map((file) => file.path).filter(Boolean)

    let userMsgText = inputText.trim()
    if (otherFiles.length > 0) {
      const attachmentsLabel = otherFiles.map((f) => `📎 [Attached File: ${f.name}]`).join('\n')
      userMsgText += `\n\n${attachmentsLabel}`
    }

    setInputText('')
    setAttachedFiles([])

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

    const updatedMessages: Message[] = [
      ...messages,
      {
        role: 'user',
        content: userMsgText,
        ...(currentImages.length > 0 ? { images: currentImages } : {})
      }
    ]
    saveHistory(updatedMessages)

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setIsStreaming(true)
    setIsThinking(true)
    setStreamingMessage('')

    let accumulatedResponse = ''
    let errorMessage = ''

    try {
      const bodyPayload: any = {
        model: selectedModel,
        messages: updatedMessages,
        sessionId: currentSessionId,
        mode: chatMode,
        filePaths: filePaths,
        attachedFiles: otherFiles.map((f) => ({ name: f.name, type: f.type, dataUrl: f.dataUrl }))
      }

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyPayload),
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
              } else if (data.done) {
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
            } else if (!data.done && data.content) {
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
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={
                supportsVision(selectedModel)
                  ? 'image/*,.txt,.md,.csv,.json,.pdf'
                  : '.txt,.md,.csv,.json,.pdf'
              }
              className="hidden"
              onChange={handleFileChange}
            />

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

            {/* Attached Files Chips */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {attachedFiles.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-[10px] text-indigo-300 max-w-[180px]"
                  >
                    {file.type.startsWith('image/') ? (
                      <ImageIcon className="w-3 h-3 shrink-0" />
                    ) : (
                      <FileText className="w-3 h-3 shrink-0" />
                    )}
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachedFile(i)}
                      className="ml-0.5 text-indigo-400/70 hover:text-indigo-200 transition-colors cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

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
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1 rounded-md hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                  title="Attach files"
                >
                  <Paperclip className="w-4.5 h-4.5" />
                </button>

                {/* Chat Mode Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    const newMode = chatMode === 'agent' ? 'ask' : 'agent'
                    setChatMode(newMode)
                    localStorage.setItem('luna_chat_mode', newMode)
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all cursor-pointer font-semibold text-[10px] shadow-sm select-none ${
                    chatMode === 'agent'
                      ? 'bg-green-500/10 border-green-500/25 text-green-400 hover:bg-green-500/20'
                      : 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400 hover:bg-indigo-500/20'
                  }`}
                  title="Click to switch between Agent Mode (with tools) and Ask Mode (simple chat)"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>{chatMode === 'agent' ? 'Agent Mode' : 'Ask Mode'}</span>
                </button>
                {/* Research Button */}
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-2 text-[11px] font-bold text-sky-500 transition-all cursor-pointer h-8"
                >
                  <Infinity className="w-4 h-4" />
                  <span>Research</span>
                </button>
              </div>

              {/* Right Aligned Controls: Model Select, Research, Send Button */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Model Select Dropdown — populated from installed Ollama models */}
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
                  <SelectTrigger className="h-8 text-[11px] font-mono bg-accent/40 border-0 hover:bg-accent hover:text-foreground text-muted-foreground px-2.5 w-[125px] cursor-pointer focus:ring-0">
                    <SelectValue placeholder="Model" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground text-[11px] font-mono">
                    {availableModels.length > 0 ? (
                      availableModels.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="gemma3:4b">gemma3:4b</SelectItem>
                        <SelectItem value="llama3.2-vision:11b">llama3.2-vision:11b</SelectItem>
                        <SelectItem value="qwen2.5-vl:3b">qwen2.5-vl:3b</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>

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

            {/* Integration Bar - inside the card at the bottom */}
            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <button
                type="button"
                onClick={() => {
                  setSettingsTab('skills')
                  setSettingsOpen(true)
                }}
                className="flex items-center gap-1.5 text-[11px] hover:text-foreground transition-colors cursor-pointer"
              >
                <Sparkles className="size-3.5 text-indigo-400 fill-current" />
                <span>Skills & Apps Config</span>
              </button>
              <div className="flex items-center gap-3">
                {/* GitHub */}
                <button
                  type="button"
                  title="GitHub"
                  className="transition-all hover:scale-110 cursor-pointer"
                >
                  <GithubIcon size={15} />
                </button>
                {/* Notion */}
                <button
                  type="button"
                  title="Notion"
                  onClick={() => {
                    setSettingsTab('integrations')
                    setSettingsOpen(true)
                  }}
                  className="transition-all hover:scale-110 cursor-pointer"
                >
                  <NotionIcon size={15} />
                </button>
                {/* Gmail */}
                <button
                  type="button"
                  title="Gmail"
                  className="transition-all hover:scale-110 cursor-pointer"
                >
                  <img src="/gmail.png" alt="Gmail" className="w-[15px] h-[15px] object-contain" />
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-background text-foreground transition-colors duration-300 relative justify-between items-center p-6 min-h-0 overflow-hidden">
      {/* Background Horizon Glow */}
      <img
        src="./bg.png"
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
              isExecutingCommand={isExecutingCommand}
              onStartExecuting={() => setIsExecutingCommand(true)}
              onPermissionGranted={(execute) => {
                console.log('Terminal agent permission decision:', execute)
              }}
              onCommandExecuted={async (_command, _success, output) => {
                setIsExecutingCommand(false)
                if (chatMode === 'agent') {
                  const feedback =
                    output === 'Execution denied by user.' || output === 'Execution denied by user'
                      ? `[SYSTEM_RESULT: Terminal command execution denied by user.]`
                      : `[SYSTEM_RESULT: Output:\n${output}]`
                  await handleAgentFeedback(feedback)
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Input Area Bottom Dock (only rendered when conversation has messages) */}
      {messages.length > 0 && (
        <div className="w-full max-w-5xl z-10 shrink-0">{renderInputArea()}</div>
      )}

      {/* Settings Modal */}
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} defaultTab={settingsTab} />
    </div>
  )
}

export default Chat
