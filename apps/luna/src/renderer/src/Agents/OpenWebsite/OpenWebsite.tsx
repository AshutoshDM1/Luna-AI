import React from 'react'
import { Globe, Check } from 'lucide-react'

interface OpenWebsiteAgentProps {
  url: string
  result?: { success: boolean; output: string }
}

export const OpenWebsiteAgent: React.FC<OpenWebsiteAgentProps> = ({ url, result }) => {
  if (result) {
    const success = result.success !== false
    return (
      <div className="flex flex-col gap-1.5 my-2 px-3 py-2 rounded-lg bg-neutral-900/60 border border-border/40 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground/70">
          {success ? (
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <Globe className="w-3.5 h-3.5 text-red-400 shrink-0" />
          )}
          <span>
            {success ? 'Opened website' : 'Failed to open website'}{' '}
            <span className="text-indigo-300 font-medium">{url}</span>
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
      <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0 animate-pulse" />
      <span>
        Opening website <span className="text-indigo-300 font-medium">{url}</span>...
      </span>
    </div>
  )
}
