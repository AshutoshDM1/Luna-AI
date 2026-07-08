import React from 'react'
import { Brain } from 'lucide-react'

interface MemoryAgentProps {
  action: 'write' | 'read' | 'search'
  query?: string
  content?: string
  result?: { success: boolean; output: string }
}

export const MemoryAgent: React.FC<MemoryAgentProps> = ({ action, query, content, result }) => {
  const getActionLabel = () => {
    switch (action) {
      case 'write':
        return `Saving to memory: "${content}"`
      case 'search':
        return `Searching memory for: "${query}"`
      case 'read':
        return 'Reading all memories...'
    }
  }

  const getResultLabel = () => {
    switch (action) {
      case 'write':
        return 'Saved successfully'
      case 'search':
        return `Search complete`
      case 'read':
        return 'Recall complete'
    }
  }

  if (result) {
    return (
      <div className="flex flex-col gap-1.5 my-2 px-3 py-2 rounded-lg bg-neutral-900/60 border border-border/40 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground/70">
          <Brain className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="font-medium text-indigo-300">{getResultLabel()}</span>
        </div>
        <div className="pl-5.5 text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap font-mono">
          {result.output}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 my-2 px-3 py-2 rounded-lg bg-neutral-900/60 border border-border/40 text-xs text-muted-foreground/70">
      <Brain className="w-3.5 h-3.5 text-indigo-400 shrink-0 animate-pulse" />
      <span>
        {getActionLabel()}
        &hellip;
      </span>
    </div>
  )
}

export default MemoryAgent
