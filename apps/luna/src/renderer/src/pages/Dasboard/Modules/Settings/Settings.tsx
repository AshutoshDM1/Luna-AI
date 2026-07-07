import React, { useState, useEffect } from 'react'
import { Keyboard, Power, Database, RefreshCw, Sliders, Check } from 'lucide-react'

export const Settings: React.FC = () => {
  const [launchOnStartup, setLaunchOnStartup] = useState(true)
  const [memoryEnabled, setMemoryEnabled] = useState(true)
  const [hotkey, setHotkey] = useState('Alt+Space')
  const [port, setPort] = useState('3001')
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Load configuration from local storage on mount
  useEffect(() => {
    try {
      const dataStr = localStorage.getItem('luna_setup')
      if (dataStr) {
        const data = JSON.parse(dataStr)
        setLaunchOnStartup(data.launchOnStartup ?? true)
        setMemoryEnabled(data.memoryEnabled ?? true)
        setHotkey(data.hotkeyEnabled ? 'Alt+Space' : 'Ctrl+Space')
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const handleSave = () => {
    try {
      const dataStr = localStorage.getItem('luna_setup')
      if (dataStr) {
        const data = JSON.parse(dataStr)
        data.launchOnStartup = launchOnStartup
        data.memoryEnabled = memoryEnabled
        data.hotkeyEnabled = hotkey === 'Alt+Space'
        localStorage.setItem('luna_setup', JSON.stringify(data))
      }
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2000)
    } catch (e) {
      console.error(e)
    }
  }

  const handleReset = () => {
    if (
      confirm('Are you sure you want to reset all onboarding settings? This will clear local data.')
    ) {
      localStorage.removeItem('luna_setup')
      window.location.reload()
    }
  }

  return (
    <div className="flex-1 flex flex-col p-8 sm:p-10 md:p-12 overflow-y-auto bg-background text-foreground transition-colors duration-300 relative">
      {/* Background Glow */}
      <img
        src="/bg.png"
        alt="Glow Horizon"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl pointer-events-none select-none z-0 opacity-15 dark:opacity-30"
      />

      <div className="w-full max-w-2xl z-10 space-y-4 animate-[fadeIn_0.3s_ease-out]">
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">System Settings</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Customize offline client features, execution shortcuts, and workspace data.
            </p>
          </div>
        </header>

        <div className="space-y-6">
          {/* Section 1: System Preferences */}
          <div className="p-6 border border-border bg-card/60 backdrop-blur-md rounded-lg space-y-4">
            <h3 className="text-xs text-muted-foreground flex items-center gap-2">
              <Power className="w-4 h-4 text-primary" />
              Startup & Memory
            </h3>

            <div className="space-y-3.5 pt-2">
              {/* Startup Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-foreground">Launch on startup</span>
                  <span className="block text-[10px] text-muted-foreground mt-0.5">
                    Start Luna automatically when you boot the OS.
                  </span>
                </div>
                <button
                  onClick={() => setLaunchOnStartup(!launchOnStartup)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                    launchOnStartup ? 'bg-primary' : 'bg-accent border border-border'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 ${
                      launchOnStartup ? 'translate-x-4 shadow-sm' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Memory Toggle */}
              <div className="flex items-center justify-between border-t border-border/40 pt-3.5">
                <div>
                  <span className="block text-xs font-bold text-foreground">
                    Persistent Local Memory
                  </span>
                  <span className="block text-[10px] text-muted-foreground mt-0.5">
                    Allow LLM brains to read local contextual history.
                  </span>
                </div>
                <button
                  onClick={() => setMemoryEnabled(!memoryEnabled)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                    memoryEnabled ? 'bg-primary' : 'bg-accent border border-border'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 ${
                      memoryEnabled ? 'translate-x-4 shadow-sm' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Shortcuts & Network */}
          <div className="p-6 border border-border bg-card/60 backdrop-blur-md rounded-lg space-y-4">
            <h3 className="text-xs text-muted-foreground flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-indigo-500" />
              Execution & Shortcuts
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Hotkey Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                  Global Hotkey Launcher
                </label>
                <input
                  type="text"
                  value={hotkey}
                  onChange={(e) => setHotkey(e.target.value)}
                  className="w-full border border-border bg-accent/40 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                />
              </div>

              {/* API Port Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                  Local API Server Port
                </label>
                <input
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="w-full border border-border bg-accent/40 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Save Action / Bottom Controls */}
          <div className="flex items-center justify-between pt-2">
            {/* Reset Data Button */}
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-destructive/40 text-destructive hover:bg-destructive/10 rounded-md font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Workspace
            </button>

            {/* Save Configuration Button */}
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-primary hover:bg-primary/95 text-primary-foreground rounded-md font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-primary/10"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Settings Saved
                </>
              ) : (
                <>
                  <Sliders className="w-3.5 h-3.5" />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
