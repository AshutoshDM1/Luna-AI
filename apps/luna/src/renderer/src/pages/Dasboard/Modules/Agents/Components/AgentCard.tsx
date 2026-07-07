import React from 'react'
import { Settings2, ShieldCheck, AlertCircle } from 'lucide-react'

export interface AgentTool {
  id: string
  name: string
  provider: string
  description: string
  permissionsCount: number
  enabled: boolean
  mcpId?: string
}

interface AgentCardProps {
  tool: AgentTool
  onToggle: (id: string) => void
}

export const AgentCard: React.FC<AgentCardProps> = ({ tool, onToggle }) => {
  return (
    <div
      className={`p-5 rounded-lg border bg-card/60 backdrop-blur-md transition-all flex flex-col justify-between h-full hover:shadow-md hover:border-primary/30 ${
        tool.enabled ? 'border-primary/50' : 'border-border'
      }`}
    >
      <div className="space-y-4">
        {/* Header: Name & Status Switch */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="font-extrabold text-sm tracking-tight text-foreground">{tool.name}</h4>
            <p className="text-[10px] text-muted-foreground mt-0.5">{tool.provider}</p>
          </div>

          {/* Custom Minimal Toggle Switch */}
          <button
            onClick={() => onToggle(tool.id)}
            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
              tool.enabled ? 'bg-primary' : 'bg-accent border border-border'
            }`}
            aria-label={`Toggle ${tool.name}`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 ${
                tool.enabled ? 'translate-x-4 shadow-sm' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Description */}
        <p className="text-[11px] text-muted-foreground leading-relaxed">{tool.description}</p>
      </div>

      {/* Footer Info & Actions */}
      <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between text-[10px]">
        {/* Permission / Status Info */}
        <div className="flex items-center gap-1 text-muted-foreground">
          {tool.enabled ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{tool.permissionsCount} tools active</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-muted-foreground/60" />
              <span>Inactive</span>
            </>
          )}
        </div>

        {/* Configuration Button */}
        <button
          disabled={!tool.enabled}
          className={`flex items-center gap-1 font-semibold transition-all ${
            tool.enabled
              ? 'text-primary hover:text-primary/80 cursor-pointer'
              : 'text-muted-foreground/40 cursor-not-allowed'
          }`}
        >
          <Settings2 className="w-3 h-3" />
          <span>Configure</span>
        </button>
      </div>
    </div>
  )
}
