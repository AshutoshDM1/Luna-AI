import React from 'react'
import { Input } from '@/components/ui/input'

interface StepProfileProps {
  userName: string
  setUserName: (val: string) => void
  assistantName: string
  setAssistantName: (val: string) => void
}

export const StepProfile: React.FC<StepProfileProps> = ({
  userName,
  setUserName,
  assistantName,
  setAssistantName
}) => {
  return (
    <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
      <div>
        <h3 className="text-base font-bold tracking-tight text-foreground">Assistant Profile</h3>
        <p className="text-xs text-muted-foreground">
          Personalize your credentials and assistant settings.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Your Name
        </label>
        <Input
          type="text"
          required
          placeholder="Enter your name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="bg-background border-border text-foreground h-10 px-3 rounded-md"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Assistant Name
        </label>
        <Input
          type="text"
          required
          placeholder="e.g. Luna"
          value={assistantName}
          onChange={(e) => setAssistantName(e.target.value)}
          className="bg-background border-border text-foreground h-10 px-3 focus-visible:ring-primary/20 rounded-md"
        />
      </div>
    </div>
  )
}
