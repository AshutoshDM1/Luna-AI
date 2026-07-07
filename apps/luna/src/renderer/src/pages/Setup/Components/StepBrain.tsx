import React from 'react'

interface Model {
  id: string
  name: string
  description: string
}

interface StepBrainProps {
  models: Model[]
  selectedModel: string
  setSelectedModel: (val: string) => void
}

export const StepBrain: React.FC<StepBrainProps> = ({
  models,
  selectedModel,
  setSelectedModel
}) => {
  return (
    <div className="space-y-3 animate-[fadeIn_0.3s_ease-out]">
      <div>
        <h3 className="text-base font-bold tracking-tight text-foreground">Select Local Brain</h3>
        <p className="text-xs text-muted-foreground">
          Select the AI engine configuration for offline computing.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {models.map((model) => (
          <div
            key={model.id}
            onClick={() => setSelectedModel(model.id)}
            className={`flex flex-col p-3 rounded-md border transition-all duration-200 cursor-pointer ${
              selectedModel === model.id
                ? 'border-indigo-500 bg-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                : 'border-border/50 bg-background/50 hover:border-border hover:bg-background/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-foreground">{model.name}</span>
            </div>
            <span
              className={`text-[10px] mt-0.5 leading-normal transition-colors ${
                selectedModel === model.id ? 'text-white/70' : 'text-muted-foreground/50'
              }`}
            >
              {model.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
