import React from 'react'
import { FileText, Check } from 'lucide-react'

interface MakeNoteAgentProps {
  result?: { success: boolean; output: string }
}

export const MakeNoteAgent: React.FC<MakeNoteAgentProps> = ({ result }) => {
  if (result) {
    const success = result.success !== false
    return (
      <div className="flex flex-col gap-1.5 my-2 px-3 py-2 rounded-lg bg-neutral-900/60 border border-border/40 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground/70">
          {success ? (
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-red-400 shrink-0" />
          )}
          <span>{success ? 'Created and opened note' : 'Failed to create note'}</span>
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
      <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0 animate-pulse" />
      <span>Creating and opening note...</span>
    </div>
  )
}
