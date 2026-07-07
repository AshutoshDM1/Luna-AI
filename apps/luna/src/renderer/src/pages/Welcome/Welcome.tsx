import React from 'react'
import { CapsuleBadge } from '@/components/ui/capsule-badge'
import { BrandButton } from '@/shared/BrandButton'

interface WelcomeProps {
  onGetStarted?: () => void
}

export const Welcome: React.FC<WelcomeProps> = ({ onGetStarted }) => {
  return (
    <div className="setup-dark relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-black font-sans select-none text-foreground p-6">
      {/* Main Content Container */}
      <div className="relative w-full max-w-4xl flex flex-col items-center justify-center z-10 text-center px-4 md:px-6">
        {/* Top Reusable Badge */}
        <div className="mb-8 animate-[fadeIn_0.5s_ease-out]">
          <CapsuleBadge pillText="AI" label="Personal AI Companion" />
        </div>

        {/* Large Premium Welcome Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-medium tracking-tight text-white mb-6 leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] animate-[fadeIn_0.6s_ease-out]">
          Meet Luna.
          <br />
          <span className="text-white">Your Desktop Companion.</span>
        </h1>

        {/* Sub-headline / Copy */}
        <p className="text-sm sm:text-base text-slate-200 font-sans max-w-xl leading-relaxed mb-8 opacity-90 whitespace-pre-line animate-[fadeIn_0.7s_ease-out]">
          An AI-powered personal desktop assistant running entirely on your computer.
          <br />
          Enjoy a faster, fully private, and deeply personalized offline experience.
        </p>

        {/* Action Buttons */}
        <div className="flex justify-center w-full animate-[fadeIn_0.8s_ease-out] z-20">
          <BrandButton onClick={onGetStarted}>Get Started</BrandButton>
        </div>
      </div>

      {/* Bottom Horizon Glow (Image-based) */}
      <img
        src="/bg.png"
        alt="Background glow"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-7xl pointer-events-none select-none z-0 opacity-80"
      />

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
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

export default Welcome
