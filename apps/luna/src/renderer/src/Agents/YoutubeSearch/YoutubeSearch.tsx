import React from 'react'
import { Check } from 'lucide-react'

export const CustomYoutubeIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
  >
    <path d="M29.41,9.26a3.5,3.5,0,0,0-2.47-2.47C24.76,6.2,16,6.2,16,6.2s-8.76,0-10.94.59A3.5,3.5,0,0,0,2.59,9.26,36.13,36.13,0,0,0,2,16a36.13,36.13,0,0,0,.59,6.74,3.5,3.5,0,0,0,2.47,2.47C7.24,25.8,16,25.8,16,25.8s8.76,0,10.94-.59a3.5,3.5,0,0,0,2.47-2.47A36.13,36.13,0,0,0,30,16,36.13,36.13,0,0,0,29.41,9.26ZM13.2,20.2V11.8L20.47,16Z" />
  </svg>
)

interface YoutubeSearchAgentProps {
  query: string
  result?: { success: boolean; output: string }
}

export const YoutubeSearchAgent: React.FC<YoutubeSearchAgentProps> = ({ query, result }) => {
  if (result) {
    const success = result.success !== false
    return (
      <div className="flex flex-col gap-1.5 my-2 px-3 py-2 rounded-lg bg-neutral-900/60 border border-border/40 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground/70">
          {success ? (
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <CustomYoutubeIcon className="w-3.5 h-3.5 text-red-400 shrink-0" />
          )}
          <span>
            {success ? 'Opened YouTube' : 'Failed to open YouTube'}{' '}
            <span className="text-indigo-300 font-medium">"{query}"</span>
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
      <CustomYoutubeIcon className="w-3.5 h-3.5 text-red-500 shrink-0 animate-pulse" />
      <span>
        Searching YouTube for <span className="text-indigo-300 font-medium">"{query}"</span>...
      </span>
    </div>
  )
}
