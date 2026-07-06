import React, { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface SetupProps {
  onComplete: (data: {
    userName: string
    assistantName: string
    model: string
    launchOnStartup: boolean
    hotkeyEnabled: boolean
    memoryEnabled: boolean
  }) => void
  onBack: () => void
}

const MODELS = [
  { id: 'llama3', name: 'Llama 3 (8B)', description: 'Balanced and fast for general tasks' },
  { id: 'gemma2', name: 'Gemma 2 (9B)', description: 'Google-optimized for creative prompts' },
  { id: 'qwen2.5', name: 'Qwen 2.5 (7B)', description: 'Highly competent at coding & reasoning' }
]

export const Setup: React.FC<SetupProps> = ({ onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState(0)

  // Step 1: Profile
  const [userName, setUserName] = useState('')
  const [assistantName, setAssistantName] = useState('Luna')

  // Step 2: Model
  const [selectedModel, setSelectedModel] = useState('llama3')

  // Step 3: Desktop integration preferences
  const [launchOnStartup, setLaunchOnStartup] = useState(true)
  const [hotkeyEnabled, setHotkeyEnabled] = useState(true)
  const [memoryEnabled, setMemoryEnabled] = useState(true)

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep((prev) => prev + 1)
    } else {
      onComplete({
        userName,
        assistantName,
        model: selectedModel,
        launchOnStartup,
        hotkeyEnabled,
        memoryEnabled
      })
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    } else {
      onBack()
    }
  }

  // Check if button is disabled for first step if username is empty
  const isNextDisabled = currentStep === 0 && !userName.trim()

  return (
    <div className="dark min-h-screen w-full flex flex-col md:flex-row bg-background text-foreground font-sans transition-colors duration-200 relative overflow-hidden">
      {/* 1. Deep Space Radial Gradient Background (Matching Welcome Page) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 50% 50%, rgba(29, 78, 216, 0.45) 0%, rgba(30, 58, 138, 0.25) 40%, rgba(2, 6, 23, 1) 100%)
          `
        }}
      />

      {/* 2. Diagonal Grid Lines Overlay (Matching Welcome Page) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage:
            'repeating-linear-gradient(-45deg, rgba(59, 130, 246, 0.15) 0px, rgba(59, 130, 246, 0.15) 1px, transparent 1px, transparent 40px)',
          maskImage: 'radial-gradient(circle at 50% 50%, black 60%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 60%, transparent 100%)'
        }}
      />

      {/* 3. Celestial Star Particles (Matching Welcome Page) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[12%] left-[18%] w-1 h-1 rounded-full bg-white opacity-40" />
        <div className="absolute top-[28%] left-[75%] w-1.5 h-1.5 rounded-full bg-white opacity-60" />
        <div className="absolute top-[68%] left-[12%] w-1 h-1 rounded-full bg-white/80 opacity-50" />
        <div className="absolute top-[82%] left-[82%] w-1 h-1 rounded-full bg-white/70 opacity-30" />
        <div className="absolute top-[45%] left-[90%] w-1.5 h-1.5 rounded-full bg-white/90 opacity-40" />
        <div className="absolute top-[75%] left-[30%] w-1 h-1 rounded-full bg-white opacity-20" />
        <div className="absolute top-[20%] left-[45%] w-1 h-1 rounded-full bg-white/50 opacity-40" />
      </div>

      {/* LEFT COLUMN: Clean Text & Progress Indicator at the bottom (transparent background) */}
      <div className="w-full md:w-[45%] flex flex-col justify-end p-10 md:p-14 relative overflow-hidden select-none shrink-0 z-10">
        {/* Onboarding Info & Progress Indicators at the bottom */}
        <div className="space-y-5">
          <div className="space-y-2">
            <span className="inline-block px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-primary/10 text-primary border border-primary/20">
              Setup
            </span>

            {currentStep === 0 && (
              <div className="space-y-1.5 animate-[fadeIn_0.4s_ease-out]">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                  Define your companion
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed max-w-sm">
                  Tell us who you are and customize the name of your new AI assistant.
                </p>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-1.5 animate-[fadeIn_0.4s_ease-out]">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                  Power your intelligence
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed max-w-sm">
                  Luna runs open-source models locally. Choose the brain that matches your system.
                </p>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-1.5 animate-[fadeIn_0.4s_ease-out]">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                  Keep your muscle memory
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed max-w-sm">
                  Configure launcher shortcuts and automatic startup properties to integrate Luna
                  seamlessly.
                </p>
              </div>
            )}
          </div>

          {/* Step Progress Dash Indicators */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-0.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? 'w-8 bg-primary' : 'w-3 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Modern Dialog Layout (rounded-md / max md) */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 md:p-16 relative overflow-hidden z-10">
        {/* Glow backdrop inside right column (Blue/Indigo glow matching Welcome Page theme) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-50"
          style={{
            background: `
              radial-gradient(circle at 50% 45%, rgba(59, 130, 246, 0.15) 0%, rgba(30, 58, 138, 0.05) 60%, transparent 100%)
            `
          }}
        />

        {/* Modern Dialog Card Container (rounded-md / max md) */}
        <div className="relative w-full max-w-md min-h-[440px] flex flex-col justify-between bg-card border border-border rounded-md p-6 sm:p-8 shadow-md z-10">
          {/* Header & Modern Back Button (ChevronIcon styled) */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-md border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs"
              aria-label="Back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Step {currentStep + 1} of 3
            </span>
          </div>

          {/* Dialog Contents */}
          <div className="flex-1 flex flex-col justify-center py-4">
            {/* STEP 1: Name Profile Input */}
            {currentStep === 0 && (
              <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                <div>
                  <h3 className="text-base font-bold tracking-tight text-foreground">
                    Assistant Profile
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Personalize your credentials and assistant settings.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Your Name
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="bg-background border-border text-foreground h-10 px-3  rounded-md"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Assistant Name
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Luna"
                    value={assistantName}
                    onChange={(e) => setAssistantName(e.target.value)}
                    className="bg-background border-border text-foreground h-10 px-3 focus-visible:ring-primary/20 rounded-md"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Local Brain Selection */}
            {currentStep === 1 && (
              <div className="space-y-3 animate-[fadeIn_0.3s_ease-out]">
                <div>
                  <h3 className="text-base font-bold tracking-tight text-foreground">
                    Select Local Brain
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Select the AI engine configuration for offline computing.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {MODELS.map((model) => (
                    <div
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      className={`flex flex-col p-3 rounded-md border transition-all duration-200 cursor-pointer ${
                        selectedModel === model.id
                          ? 'border-primary bg-primary/10 shadow-[0_0_8px_rgba(59,130,246,0.1)]'
                          : 'border-border/50 bg-background/50 hover:border-border hover:bg-background/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-foreground">{model.name}</span>
                        {selectedModel === model.id && (
                          <span className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-0.5 leading-normal">
                        {model.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: Switch Toggles */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                <div>
                  <h3 className="text-base font-bold tracking-tight text-foreground">
                    System Integrations
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Adjust how the assistant interfaces with your system environment.
                  </p>
                </div>

                <div className="space-y-4 pt-1">
                  {/* Toggle 1: Open at Login */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-foreground">Open at Login</div>
                      <div className="text-[10px] text-muted-foreground leading-normal mt-0.5">
                        Ensure {assistantName} is ready upon system boot.
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={launchOnStartup}
                      onClick={() => setLaunchOnStartup(!launchOnStartup)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        launchOnStartup ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                          launchOnStartup ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Toggle 2: Keyboard Hotkey */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-foreground">Keyboard Shortcut</div>
                      <div className="text-[10px] text-muted-foreground leading-normal mt-0.5">
                        Launch interface quickly with{' '}
                        <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-[9px]">
                          Alt + Space
                        </kbd>
                        .
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={hotkeyEnabled}
                      onClick={() => setHotkeyEnabled(!hotkeyEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        hotkeyEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                          hotkeyEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Toggle 3: Local Memory */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-foreground">
                        Local Offline Memory
                      </div>
                      <div className="text-[10px] text-muted-foreground leading-normal mt-0.5">
                        Store context and settings locally on disk.
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={memoryEnabled}
                      onClick={() => setMemoryEnabled(!memoryEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        memoryEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                          memoryEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Continue Button */}
          <div className="mt-4">
            <button
              onClick={handleNext}
              disabled={isNextDisabled}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary text-primary-foreground font-semibold text-xs transition-all duration-200 shadow-sm active:scale-[0.99] cursor-pointer"
            >
              {currentStep === 2 ? 'Launch Assistant' : 'Continue'}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
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
