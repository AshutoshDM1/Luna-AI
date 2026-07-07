import React from 'react'
import { Download, CheckCircle, Play, Layers, HardDrive, ShieldAlert } from 'lucide-react'

export interface LLMModel {
  id: string
  name: string
  developer: string
  size: string
  params: string
  status: 'active' | 'installed' | 'not-downloaded'
  useCase: string
  speed: string
}

interface ModelCardProps {
  model: LLMModel
  onActivate: (id: string) => void
  onDownload: (id: string) => void
}

export const ModelCard: React.FC<ModelCardProps> = ({ model, onActivate, onDownload }) => {
  const getStatusBadge = () => {
    switch (model.status) {
      case 'active':
        return (
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
            <CheckCircle className="w-2.5 h-2.5" />
            Active
          </span>
        )
      case 'installed':
        return (
          <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 text-[9px] font-bold uppercase tracking-wider">
            Installed
          </span>
        )
      case 'not-downloaded':
        return (
          <span className="px-2 py-0.5 rounded-md bg-muted/40 text-muted-foreground border border-border text-[9px] font-bold uppercase tracking-wider">
            Available
          </span>
        )
    }
  }

  return (
    <div
      className={`p-5 rounded-lg border bg-card/60 backdrop-blur-md transition-all flex flex-col justify-between h-full hover:shadow-md hover:border-primary/30 ${
        model.status === 'active'
          ? 'border-primary/60 ring-1 ring-primary/25 shadow-sm shadow-primary/5'
          : 'border-border'
      }`}
    >
      <div className="space-y-4">
        {/* Title & Developer */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="font-extrabold text-sm tracking-tight text-foreground">{model.name}</h4>
            <p className="text-[10px] text-muted-foreground mt-0.5">{model.developer}</p>
          </div>
          {getStatusBadge()}
        </div>

        {/* Short details / Use case */}
        <p className="text-[11px] text-muted-foreground leading-relaxed">{model.useCase}</p>

        {/* Technical specs strip */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/40 text-[10px]">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Layers className="w-3 h-3 text-primary/70" />
            <span>{model.params} Params</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <HardDrive className="w-3 h-3 text-indigo-500/70" />
            <span>Size: {model.size}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
            <ShieldAlert className="w-3 h-3 text-amber-500/70" />
            <span>Evaluation speed: {model.speed}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3 border-t border-border/40">
        {model.status === 'active' && (
          <button
            disabled
            className="w-full py-2 rounded-xl bg-primary/10 text-primary font-bold text-xs cursor-default flex items-center justify-center gap-1.5"
          >
            <CheckCircle className="w-3.5 h-3.5 fill-current" />
            Currently Active
          </button>
        )}

        {model.status === 'installed' && (
          <button
            onClick={() => onActivate(model.id)}
            className="w-full py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-primary/10"
          >
            <Play className="w-3 h-3 fill-current" />
            Activate Brain
          </button>
        )}

        {model.status === 'not-downloaded' && (
          <button
            onClick={() => onDownload(model.id)}
            className="w-full py-2 rounded-md border border-border bg-accent/40 hover:bg-accent text-foreground font-medium text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Download Model
          </button>
        )}
      </div>
    </div>
  )
}
