import React from 'react'
import { MessageSquare, Cpu, Bot, User, Settings, LogOut, Sparkles, Play } from 'lucide-react'
import { BrandLogo } from '@/shared/Logos/BrandLogo'
import { CapsuleBadge } from '@/components/ui/capsule-badge'
import { useDashboardNavigation } from '@/hooks/useDashboardNavigation'

interface DashboardProps {
  onLogout?: () => void
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const { activeTab, changeTab, menuItems } = useDashboardNavigation('chat')

  // Load Setup data for Profile tab
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

        {/* TAB: AI Chat */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col p-6 sm:p-8 overflow-y-auto animate-[fadeIn_0.3s_ease-out]">
            <header className="flex items-center justify-between pb-6 border-b border-border mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  AI Chat Sandbox
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Interact with your local offline brain.
                </p>
              </div>
            </header>
            <div className="flex-1 flex flex-col justify-center items-center p-6 border border-dashed border-border bg-card/30 rounded-xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold">Workspace Chat Experience</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                This sandbox will interface with your local {setupData.assistantName} assistant
                running on {setupData.model}.
              </p>
            </div>
          </div>
        )}

        {/* TAB: Local Brains (Models) */}
        {activeTab === 'models' && (
          <div className="flex-1 flex flex-col p-6 sm:p-8 overflow-y-auto animate-[fadeIn_0.3s_ease-out]">
            <header className="flex items-center justify-between pb-6 border-b border-border mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Local Brains Manager
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Manage downloaded local model binaries.
                </p>
              </div>
            </header>
            <div className="flex-1 flex flex-col justify-center items-center p-6 border border-dashed border-border bg-card/30 rounded-xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold">GGUF & Safetensors Workspace</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Manage, verify integrity, and download local GGUF models directly to the application
                cache.
              </p>
            </div>
          </div>
        )}

        {/* TAB: AI Agents (Welcome design) */}
        {activeTab === 'agents' && (
          <div className="flex-1 flex flex-col items-center justify-center bg-black text-white relative overflow-hidden p-6 sm:p-8 select-none animate-[fadeIn_0.3s_ease-out]">
            {/* Glow Image */}
            <img
              src="/bg.png"
              alt="Glow Horizon"
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-7xl pointer-events-none select-none z-0 opacity-80"
            />

            {/* Center Content */}
            <div className="relative w-full max-w-2xl flex flex-col items-center justify-center z-10 text-center">
              <div className="mb-6 animate-[fadeIn_0.5s_ease-out]">
                <CapsuleBadge pillText="Agents" label="Autonomous Workflows" />
              </div>

              <h1 className="text-3xl sm:text-5xl font-medium tracking-tight text-white mb-6 leading-tight drop-shadow-md">
                Deploy AI Agents.
                <br />
                <span className="text-white/80">Automate your desktop tasks.</span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed mb-8 opacity-90">
                Spawns autonomous local agents capable of executing desktop automation, file
                manipulations, and background task scheduling privately and securely.
              </p>

              <button className="px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-600/20">
                <Play className="w-3.5 h-3.5 fill-current" />
                Initialize Agent Cluster
              </button>
            </div>
          </div>
        )}

        {/* TAB: Profile */}
        {activeTab === 'profile' && (
          <div className="flex-1 flex flex-col p-6 sm:p-8 overflow-y-auto animate-[fadeIn_0.3s_ease-out]">
            <header className="flex items-center justify-between pb-6 border-b border-border mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">User Profile</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your local identity and assistant settings.
                </p>
              </div>
            </header>
            <div className="max-w-md p-6 border border-border bg-card rounded-xl shadow-xs space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-600/10 text-indigo-500 flex items-center justify-center font-bold text-base border border-indigo-500/20">
                  {setupData.userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">{setupData.userName}</h3>
                  <p className="text-[10px] text-muted-foreground">Luna Desktop User</p>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Assistant Companion:</span>
                  <span className="font-semibold">{setupData.assistantName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Active Model Brain:</span>
                  <span className="font-semibold uppercase">{setupData.model}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">System Language:</span>
                  <span className="font-semibold uppercase">{setupData.language}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Setup Status:</span>
                  <span className="text-emerald-500 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 fill-current" /> Completed
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Settings */}
        {activeTab === 'settings' && (
          <div className="flex-1 flex flex-col p-6 sm:p-8 overflow-y-auto animate-[fadeIn_0.3s_ease-out]">
            <header className="flex items-center justify-between pb-6 border-b border-border mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  System Preferences
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure keyboard hotkeys and ports.
                </p>
              </div>
            </header>
            <div className="flex-1 flex flex-col justify-center items-center p-6 border border-dashed border-border bg-card/30 rounded-xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Settings className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold">Preferences Manager</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Modify global keyboard shortcuts, local database backup utilities, and API ports
                configuration.
              </p>
            </div>
          </div>
        )}
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
