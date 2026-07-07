import React from 'react'
import { CapsuleBadge } from '@/components/ui/capsule-badge'

interface SetupSidebarProps {
  currentStep: number
}

export const SetupSidebar: React.FC<SetupSidebarProps> = ({ currentStep }) => {
  return (
    <div className="w-full md:w-1/2 flex flex-col justify-end p-10 md:p-14 relative overflow-hidden select-none shrink-0 z-10 bg-black">
      {/* Bottom Horizon Glow (Image-based matching Welcome page) */}
      <img
        src="/bg.png"
        alt="Background glow"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl pointer-events-none select-none z-0 opacity-70"
      />

      {/* Onboarding Info & Progress Indicators at the bottom */}
      <div className="space-y-5 relative z-10">
        <div className="space-y-3">
          <div className="animate-[fadeIn_0.5s_ease-out]">
            <CapsuleBadge pillText="Setup" label={`Step ${currentStep + 1} of 3`} />
          </div>

          {currentStep === 0 && (
            <div className="space-y-1.5 animate-[fadeIn_0.4s_ease-out]">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                Define your companion
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Tell us who you are and customize the name of your new AI assistant.
              </p>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-1.5 animate-[fadeIn_0.4s_ease-out]">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                Power your intelligence
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Luna runs open-source models locally. Choose the brain that matches your system.
              </p>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-1.5 animate-[fadeIn_0.4s_ease-out]">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                Keep your muscle memory
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
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
                i === currentStep ? 'w-8 bg-indigo-500' : 'w-3 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
