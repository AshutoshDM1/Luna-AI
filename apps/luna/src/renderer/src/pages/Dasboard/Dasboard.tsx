import React, { useState, useEffect, useCallback } from 'react'
import { Settings as SettingsIcon } from 'lucide-react'
import { BrandLogo } from '@/shared/Logos/BrandLogo'
import { useDashboardNavigation } from '@/hooks/useDashboardNavigation'
import ApiClient from '@/lib/apiClient'
import { api } from '@/services/api'

// Import Modules from nested subfolders
import Chat from './Modules/Chat/Chat'
import LocalLlmModels from './Modules/LocalLlmModels/LocalLlmModels'
import Agents from './Modules/Agents/Agents'
import Profile from './Modules/Profile/Profile'
import Settings from './Modules/Settings/Settings'
import ChatSidebar from './components/ChatSidebar'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface DashboardProps {
  onLogout?: () => void
}

export const Dashboard: React.FC<DashboardProps> = () => {
  const { activeTab, changeTab, menuItems } = useDashboardNavigation('chat')

  // Load Setup data for Profile/Chat modules
  const getSetupData = () => {
    try {
      const data = localStorage.getItem('luna_setup')
      if (data) return JSON.parse(data)
    } catch (e) {
      console.error(e)
    }
    return {
      userName: 'User',
      assistantName: 'Luna',
      model: 'llama3',
      language: 'en',
      theme: 'dark'
    }
  }

  const setupData = getSetupData()

  // User State
  const [currentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('luna_setup')
      const userId = localStorage.getItem('luna_user_id')
      if (saved && userId) {
        const parsed = JSON.parse(saved)
        return { id: userId, name: parsed.userName }
      }
    } catch (e) {
      console.error(e)
    }
    return null
  })

  // Chat Session states lifted from Chat.tsx
  const [sessions, setSessions] = useState<any[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editTitleText, setEditTitleText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isChatListCollapsed, setIsChatListCollapsed] = useState(false)
  const [ollamaRunning, setOllamaRunning] = useState<boolean | null>(null)

  // Poll Ollama running status every 5 seconds
  useEffect(() => {
    const checkOllama = async () => {
      try {
        const res = await api.get('/ollama/status')
        setOllamaRunning(res.data.running === true)
      } catch {
        setOllamaRunning(false)
      }
    }
    checkOllama()
    const interval = setInterval(checkOllama, 5000)
    return () => clearInterval(interval)
  }, [])

  // Fetch recent sessions on mount
  const fetchSessions = useCallback(async () => {
    if (!currentUser) return
    const response = await ApiClient.get<any[]>(`/chat/sessions?userId=${currentUser.id}`)
    if (response.ok && response.data) {
      setSessions(response.data)
      if (response.data.length > 0 && !activeSessionId) {
        loadSession(response.data[0].id)
      }
    }
  }, [currentUser, activeSessionId])

  useEffect(() => {
    if (currentUser) {
      fetchSessions()
    }
  }, [currentUser])

  const loadSession = useCallback(async (sessionId: string) => {
    setActiveSessionId(sessionId)
    const response = await ApiClient.get<Message[]>(`/chat/sessions/${sessionId}/messages`)
    if (response.ok && response.data) {
      setMessages(response.data)
    }
  }, [])

  const handleCreateSession = useCallback(async () => {
    if (!currentUser) return
    const response = await ApiClient.post<any>('/chat/sessions', {
      userId: currentUser.id,
      title: 'New Chat'
    })
    if (response.ok && response.data) {
      setSessions((prev) => [response.data, ...prev])
      setActiveSessionId(response.data.id)
      setMessages([])
    }
  }, [currentUser])

  const handleRenameSession = useCallback(async (sessionId: string, newTitle: string) => {
    if (!newTitle.trim()) return
    const response = await ApiClient.put<any>(`/chat/sessions/${sessionId}`, {
      title: newTitle
    })
    if (response.ok) {
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, title: newTitle } : s)))
      setEditingSessionId(null)
    }
  }, [])

  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      const response = await ApiClient.delete<any>(`/chat/sessions/${sessionId}`)
      if (response.ok) {
        const remaining = sessions.filter((s) => s.id !== sessionId)
        setSessions(remaining)
        if (activeSessionId === sessionId) {
          if (remaining.length > 0) {
            loadSession(remaining[0].id)
          } else {
            setActiveSessionId(null)
            setMessages([])
          }
        }
      }
    },
    [sessions, activeSessionId, loadSession]
  )

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      {/* 1. Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col justify-between p-4 shrink-0 transition-colors duration-300">
        <div className="space-y-6 flex flex-col h-full min-h-0">
          {/* Logo / Title */}
          <div className="flex items-center gap-3 px-2 py-1 shrink-0">
            <BrandLogo size={32} className="rounded-lg shadow-md" />
            <div>
              <h1 className="font-extrabold text-sm tracking-tight">Luna AI</h1>
              <p className="text-[10px] text-muted-foreground">Local Desktop Suite</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 overflow-y-auto flex-1 pr-1 select-none min-h-0">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isChat = item.id === 'chat'
              const isSelected = activeTab === item.id

              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => {
                      if (isChat && isSelected) {
                        setIsChatListCollapsed(!isChatListCollapsed)
                      } else {
                        changeTab(item.id)
                        if (isChat) {
                          setIsChatListCollapsed(false)
                        }
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {isChat && (
                      <span className="text-[10px] opacity-60">
                        {isChatListCollapsed ? '▶' : '▼'}
                      </span>
                    )}
                  </button>

                  {/* Nested Chat Sessions Folder List */}
                  {isChat && !isChatListCollapsed && (
                    <div className="pl-4 pr-1 py-1 space-y-0.5 max-h-60 overflow-y-auto animate-[fadeIn_0.2s_ease-out]">
                      <ChatSidebar
                        sessions={sessions}
                        activeSessionId={activeSessionId}
                        editingSessionId={editingSessionId}
                        setEditingSessionId={setEditingSessionId}
                        editTitleText={editTitleText}
                        setEditTitleText={setEditTitleText}
                        loadSession={loadSession}
                        handleCreateSession={handleCreateSession}
                        handleRenameSession={handleRenameSession}
                        handleDeleteSession={handleDeleteSession}
                        changeTab={changeTab}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer (Settings button + Ollama status) */}
        <div className="border-t border-border pt-4 shrink-0 space-y-2">
          <button
            onClick={() => changeTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Settings</span>
          </button>

          {/* Ollama Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                ollamaRunning === null
                  ? 'bg-yellow-400 animate-pulse'
                  : ollamaRunning
                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)] animate-pulse'
                    : 'bg-red-500'
              }`}
            />
            <span className="text-[10px] text-muted-foreground">
              {ollamaRunning === null
                ? 'Checking Ollama...'
                : ollamaRunning
                  ? 'Ollama running'
                  : 'Ollama offline'}
            </span>
          </div>
        </div>
      </aside>

      {/* 2. Main Dashboard Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden relative">
        {/* Content Tabs */}
        {activeTab === 'chat' && (
          <Chat
            assistantName={setupData.assistantName}
            model={setupData.model}
            activeSessionId={activeSessionId}
            setActiveSessionId={setActiveSessionId}
            sessions={sessions}
            setSessions={setSessions}
            messages={messages}
            setMessages={setMessages}
            loadSession={loadSession}
            handleCreateSession={handleCreateSession}
            handleRenameSession={handleRenameSession}
            handleDeleteSession={handleDeleteSession}
          />
        )}

        {activeTab === 'models' && <LocalLlmModels />}

        {activeTab === 'agents' && <Agents />}

        {activeTab === 'profile' && (
          <Profile
            userName={setupData.userName}
            assistantName={setupData.assistantName}
            model={setupData.model}
            language={setupData.language}
          />
        )}

        {activeTab === 'settings' && <Settings />}
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default Dashboard
