import React from 'react'
import { ChevronLeft, ChevronsRight } from 'lucide-react'
import { StepProfile } from './Components/StepProfile'
import { StepBrain } from './Components/StepBrain'
import { StepIntegrations } from './Components/StepIntegrations'
import { StepOllama } from './Components/StepOllama'
import { BrandButton } from '@/shared/BrandButton'
import { CapsuleBadge } from '@/components/ui/capsule-badge'
import { useSetupNavigation } from '@/hooks/useSetupNavigation'

interface SetupProps {
  onComplete: (data: {
    userName: string
    assistantName: string
    model: string
    launchOnStartup: boolean
    hotkeyEnabled: boolean
    memoryEnabled: boolean
    language: string
    theme: string
  }) => void
  onBack: () => void
}

const MODELS = [
  {
    id: 'gemma3:4b',
    name: 'Gemma 3 (4B)',
    description: 'Google-optimized compact offline brain (Primary)'
  },
  { id: 'llama3', name: 'Llama 3 (8B)', description: 'Balanced and fast for general tasks' },
  { id: 'gemma2', name: 'Gemma 2 (9B)', description: 'Google-optimized for creative prompts' },
  { id: 'qwen2.5', name: 'Qwen 2.5 (7B)', description: 'Highly competent at coding & reasoning' }
]

export const Setup: React.FC<SetupProps> = ({ onComplete, onBack }) => {
  const { currentStep, nextStep, prevStep, isNextDisabled, formState, setters } =
    useSetupNavigation(onComplete, onBack)

  return (
    <div className="setup-dark min-h-screen w-full flex flex-col justify-center items-center bg-black text-foreground font-sans transition-colors duration-200 relative overflow-hidden p-6">
      {/* Bottom Horizon Glow (Image-based) */}
      <img
        src="/bg.png"
        alt="Background glow"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-7xl pointer-events-none select-none z-0 opacity-85"
      />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md flex flex-col-reverse items-center gap-8">
        {/* Setup Dialog Card Container */}
        <div className="relative w-full flex flex-col justify-between bg-black/10 backdrop-blur-xl border border-muted rounded-xl p-6 sm:p-8 shadow-2xl">
          {/* Header & Back Button */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={prevStep}
              className="p-1.5 rounded-md border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs"
              aria-label="Back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Step {currentStep + 1} of 4
            </span>
          </div>

          {/* Dialog Contents */}
          <div className="flex-1 flex flex-col justify-center py-4">
            {currentStep === 0 && (
              <StepProfile
                userName={formState.userName}
                setUserName={setters.setUserName}
                assistantName={formState.assistantName}
                setAssistantName={setters.setAssistantName}
              />
            )}

            {currentStep === 1 && (
              <StepBrain
                models={MODELS}
                selectedModel={formState.selectedModel}
                setSelectedModel={setters.setSelectedModel}
              />
            )}

            {currentStep === 2 && (
              <StepIntegrations
                assistantName={formState.assistantName}
                launchOnStartup={formState.launchOnStartup}
                setLaunchOnStartup={setters.setLaunchOnStartup}
                hotkeyEnabled={formState.hotkeyEnabled}
                setHotkeyEnabled={setters.setHotkeyEnabled}
                memoryEnabled={formState.memoryEnabled}
                setMemoryEnabled={setters.setMemoryEnabled}
                language={formState.language}
                setLanguage={setters.setLanguage}
                theme={formState.theme}
                setTheme={setters.setTheme}
              />
            )}

            {currentStep === 3 && (
              <StepOllama model={formState.selectedModel} onComplete={nextStep} />
            )}
          </div>

          {/* Action Continue Button using BrandButton (hidden on step 4 as it has custom download buttons) */}
          {currentStep < 3 && (
            <div className="mt-4">
              <BrandButton
                onClick={nextStep}
                disabled={isNextDisabled}
                className="w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:opacity-50"
              >
                {currentStep === 2 ? 'Continue to Core Setup' : 'Continue'}
                <ChevronsRight className="size-4" />
              </BrandButton>
            </div>
          )}
        </div>

        {/* Text info and step dots at the bottom */}
        <div className="w-full flex flex-col items-center text-center space-y-4">
          <div className="animate-[fadeIn_0.5s_ease-out]">
            <CapsuleBadge pillText="Setup" label={`Step ${currentStep + 1} of 4`} />
          </div>

          {currentStep === 0 && (
            <div className="space-y-1.5 animate-[fadeIn_0.4s_ease-out]">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                Define your companion
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Tell us who you are and customize the name of your new AI assistant.
              </p>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-1.5 animate-[fadeIn_0.4s_ease-out]">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                Power your intelligence
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Luna runs open-source models locally. Choose the brain that matches your system.
              </p>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-1.5 animate-[fadeIn_0.4s_ease-out]">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                Keep your muscle memory
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Configure launcher shortcuts and automatic startup properties to integrate Luna
                seamlessly.
              </p>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-1.5 animate-[fadeIn_0.4s_ease-out]">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                Offline engine initialization
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Luna validates if your system has Ollama installed, downloads it if missing, and
                downloads the model.
              </p>
            </div>
          )}

          {/* Step Progress Dash Indicators */}
          <div className="flex items-center gap-1.5 pt-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-0.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? 'w-8 bg-indigo-500' : 'w-3 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default Setup
