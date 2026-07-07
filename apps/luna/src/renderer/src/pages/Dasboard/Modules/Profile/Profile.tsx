import React from 'react'
import { Sparkles, Shield, Bot, Globe, User } from 'lucide-react'

interface ProfileProps {
  userName: string
  assistantName: string
  model: string
  language: string
}

export const Profile: React.FC<ProfileProps> = ({ userName, assistantName, model, language }) => {
  const formatModel = (m: string) => {
    if (m === 'llama3') return 'Llama 3 (8B)'
    if (m === 'gemma2') return 'Gemma 2 (9B)'
    if (m === 'qwen2.5') return 'Qwen 2.5 (7B)'
    return m.toUpperCase()
  }

  return (
    <div className="flex-1 flex flex-col p-8 sm:p-10 md:p-12 overflow-y-auto bg-background text-foreground transition-colors duration-300 relative">
      {/* Background Glow */}
      <img
        src="./bg.png"
        alt="Glow Horizon"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl pointer-events-none select-none z-0 opacity-15 dark:opacity-30"
      />

      <div className="w-full max-w-2xl z-10 space-y-4 animate-[fadeIn_0.3s_ease-out]">
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">User Profile</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review and manage your local desktop assistant credentials.
            </p>
          </div>
        </header>

        <div className="space-y-6">
          {/* Card 1: Administrator Avatar details */}
          <div className="p-6 border border-border bg-card/60 backdrop-blur-md rounded-lg flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-linear-to-tr from-primary to-indigo-600 text-primary-foreground flex items-center justify-center font-black text-2xl shadow-md shadow-primary/20">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-foreground">
                {userName}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Local System Administrator</p>
            </div>
          </div>

          {/* Card 2: Configuration parameters */}
          <div className="p-6 border border-border bg-card/60 backdrop-blur-md rounded-lg space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Instance Details
            </h3>

            <div className="border-t border-border/40 pt-2 space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Companion Name
                </span>
                <span className="font-semibold text-foreground">{assistantName}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-border/40 pt-3">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-purple-500" />
                  Active Model
                </span>
                <span className="font-semibold text-foreground">{formatModel(model)}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-border/40 pt-3">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-500" />
                  System Language
                </span>
                <span className="font-semibold text-foreground uppercase">{language}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-border/40 pt-3">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-500" />
                  Security Status
                </span>
                <span className="text-emerald-500 font-bold">100% Offline (Localhost)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
