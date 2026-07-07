import React from 'react'
import { Plus, MessageSquare, Edit2, Trash2 } from 'lucide-react'
import { DashboardTab } from '@/hooks/useDashboardNavigation'

interface ChatSidebarProps {
  sessions: any[]
  activeSessionId: string | null
  editingSessionId: string | null
  setEditingSessionId: (id: string | null) => void
  editTitleText: string
  setEditTitleText: (text: string) => void
  loadSession: (sessionId: string) => Promise<void>
  handleCreateSession: () => Promise<void>
  handleRenameSession: (sessionId: string, newTitle: string) => Promise<void>
  handleDeleteSession: (sessionId: string) => Promise<void>
  changeTab: (tabId: DashboardTab) => void
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  activeSessionId,
  editingSessionId,
  setEditingSessionId,
  editTitleText,
  setEditTitleText,
  loadSession,
  handleCreateSession,
  handleRenameSession,
  handleDeleteSession,
  changeTab
}) => {
  return (
    <div className="space-y-1.5">
      {/* + New Chat Button at the top of the chat section */}
      <button
        onClick={handleCreateSession}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/25 hover:bg-indigo-500/15 text-indigo-400 transition-all cursor-pointer shadow-sm active:scale-[0.98] mb-2"
        title="Create New Conversation"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>New Chat</span>
      </button>

      {/* Chat Sessions list */}
      <div className="space-y-0.5">
        {sessions.map((session) => {
          const isSessionSelected = session.id === activeSessionId
          const isSessionEditing = session.id === editingSessionId

          return (
            <div
              key={session.id}
              className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 transition-all relative ${
                isSessionSelected
                  ? 'bg-accent/80 text-foreground font-medium border border-border/40'
                  : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground'
              }`}
            >
              <div
                className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                onClick={() => {
                  if (!isSessionEditing) {
                    changeTab('chat')
                    loadSession(session.id)
                  }
                }}
              >
                <MessageSquare className="w-3 h-3 shrink-0 opacity-60" />
                {isSessionEditing ? (
                  <input
                    type="text"
                    value={editTitleText}
                    onChange={(e) => setEditTitleText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRenameSession(session.id, editTitleText)
                      } else if (e.key === 'Escape') {
                        setEditingSessionId(null)
                      }
                    }}
                    onBlur={() => handleRenameSession(session.id, editTitleText)}
                    autoFocus
                    className="w-full bg-background border border-indigo-500/50 rounded px-1 text-[10px] text-foreground outline-none font-sans"
                  />
                ) : (
                  <span className="text-[11px] truncate block pr-2">{session.title}</span>
                )}
              </div>

              {!isSessionEditing && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingSessionId(session.id)
                      setEditTitleText(session.title)
                    }}
                    className="p-0.5 rounded hover:bg-accent-foreground/10 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
                    title="Rename"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('Delete this conversation?')) {
                        handleDeleteSession(session.id)
                      }
                    }}
                    className="p-0.5 rounded hover:bg-red-500/10 text-muted-foreground/60 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {sessions.length === 0 && (
          <p className="text-[10px] text-muted-foreground/60 pl-6 py-1">No recent chats</p>
        )}
      </div>
    </div>
  )
}

export default ChatSidebar
