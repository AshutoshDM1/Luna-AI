import React from 'react'
import { Settings2, ShieldCheck } from 'lucide-react'

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
  onConfigure?: (id: string) => void
}

export const AgentCard: React.FC<AgentCardProps> = ({ tool, onConfigure }) => {
  return (
    <div className="p-5 rounded-lg bg-card/60 backdrop-blur-md transition-all flex flex-col justify-between h-full hover:shadow-md border-2 hover:border-primary/10 border-primary/40">
      <div className="space-y-4">
        {/* Header: Name & Status Switch */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="font-extrabold text-sm tracking-tight text-foreground">{tool.name}</h4>
            <p className="text-[10px] text-muted-foreground mt-0.5">{tool.provider}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-[11px] text-muted-foreground leading-relaxed">{tool.description}</p>
      </div>

      {/* Footer Info & Actions */}
      <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between text-[10px]">
        {/* Permission / Status Info */}
        <div className="flex items-center gap-1 text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>{tool.permissionsCount} tools available</span>
        </div>

        {tool.mcpId && (
          <button
            onClick={() => onConfigure?.(tool.id)}
            className="flex items-center gap-1 font-semibold transition-all text-primary hover:text-primary/80 cursor-pointer"
          >
            <Settings2 className="w-3 h-3" />
            <span>Configure</span>
          </button>
        )}
      </div>
    </div>
  )
}
