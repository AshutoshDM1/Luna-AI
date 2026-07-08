import React from 'react'
import { Bell, Check } from 'lucide-react'

interface SetAlarmAgentProps {
  time: string
  message: string
  result?: { success: boolean; output: string }
}

export const SetAlarmAgent: React.FC<SetAlarmAgentProps> = ({ time, message, result }) => {
  let displayTime = time
  try {
    displayTime = new Date(time).toLocaleString()
  } catch (e) {
    // ignore
  }

  if (result) {
    const success = result.success !== false
    return (
      <div className="flex flex-col gap-1.5 my-2 px-3 py-2 rounded-lg bg-neutral-900/60 border border-border/40 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground/70">
          {success ? (
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <Bell className="w-3.5 h-3.5 text-red-400 shrink-0" />
          )}
          <span>
            {success ? 'Alarm set for' : 'Failed to set alarm for'}{' '}
            <span className="text-indigo-300 font-medium">{displayTime}</span>
          </span>
        </div>
        {result.output && (
          <div className="pl-5.5 text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans">
            {result.output}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 my-2 px-3 py-2 rounded-lg bg-neutral-900/60 border border-border/40 text-xs text-muted-foreground/70">
      <Bell className="w-3.5 h-3.5 text-indigo-400 shrink-0 animate-pulse" />
      <span>
        Setting alarm for <span className="text-indigo-300 font-medium">{displayTime}</span>...
      </span>
    </div>
  )
}
