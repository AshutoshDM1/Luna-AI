import React from 'react'
import { LogOut } from 'lucide-react'
import { BrandLogo } from '@/shared/Logos/BrandLogo'
import { useDashboardNavigation } from '@/hooks/useDashboardNavigation'

// Import Modules from nested subfolders
import Chat from './Modules/Chat/Chat'
import LocalLlmModels from './Modules/LocalLlmModels/LocalLlmModels'
import Agents from './Modules/Agents/Agents'
import Profile from './Modules/Profile/Profile'
import Settings from './Modules/Settings/Settings'

interface DashboardProps {
  onLogout?: () => void
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      {/* 1. Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col justify-between p-4 shrink-0 transition-colors duration-300">
        <div className="space-y-6">
          {/* Logo / Title */}
          <div className="flex items-center gap-3 px-2 py-1">
            <BrandLogo size={32} className="rounded-lg shadow-md" />
            <div>
              <h1 className="font-extrabold text-sm tracking-tight">Luna AI</h1>
              <p className="text-[10px] text-muted-foreground">Local Desktop Suite</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => changeTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer (Logout only) */}
        <div className="space-y-2 border-t border-border pt-4">
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit Workspace</span>
            </button>
          )}
        </div>
      </aside>

      {/* 2. Main Dashboard Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden relative">
        {/* Content Tabs */}
        {activeTab === 'chat' && (
          <Chat assistantName={setupData.assistantName} model={setupData.model} />
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
