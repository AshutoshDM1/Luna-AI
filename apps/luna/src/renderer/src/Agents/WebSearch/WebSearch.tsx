import React from 'react'
import { Globe } from 'lucide-react'

interface WebSearchAgentProps {
  query: string
  result?: { success: boolean; output: string }
}

export const WebSearchAgent: React.FC<WebSearchAgentProps> = ({ query, result }) => {
  if (result) {
    return (
      <div className="flex flex-col gap-1.5 my-2 px-3 py-2 rounded-lg bg-neutral-900/60 border border-border/40 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground/70">
          <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>
            Searched web for{' '}
            <span className="text-indigo-300 font-medium">&ldquo;{query}&rdquo;</span>
          </span>
        </div>
        <div className="pl-5.5 text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans">
          {result.output}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 my-2 px-3 py-2 rounded-lg bg-neutral-900/60 border border-border/40 text-xs text-muted-foreground/70">
      <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0 animate-pulse" />
      <span>
        Searching web for <span className="text-indigo-300 font-medium">&ldquo;{query}&rdquo;</span>
        &hellip;
      </span>
    </div>
  )
}
