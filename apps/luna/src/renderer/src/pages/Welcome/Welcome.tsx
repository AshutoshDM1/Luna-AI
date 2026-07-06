import React from 'react'
import { BrandLogo } from '@/shared/Logos/BrandLogo'

interface WelcomeProps {
  onGetStarted?: () => void
}

export const Welcome: React.FC<WelcomeProps> = ({ onGetStarted }) => {
  return (
    <div className="dark relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-background font-sans select-none text-foreground p-6">
      {/* 1. Deep Space Radial Gradient Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 50% 50%, rgba(29, 78, 216, 0.45) 0%, rgba(30, 58, 138, 0.25) 40%, rgba(2, 6, 23, 1) 100%)
          `
        }}
      />

      {/* 2. Diagonal Grid Lines Overlay (Subtle Stripe Pattern) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage:
            'repeating-linear-gradient(-45deg, rgba(59, 130, 246, 0.15) 0px, rgba(59, 130, 246, 0.15) 1px, transparent 1px, transparent 40px)',
          maskImage: 'radial-gradient(circle at 50% 50%, black 60%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 60%, transparent 100%)'
        }}
      />

      {/* 3. Celestial Star Particles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[12%] left-[18%] w-1 h-1 rounded-full bg-white opacity-40" />
        <div className="absolute top-[28%] left-[75%] w-1.5 h-1.5 rounded-full bg-white opacity-60" />
        <div className="absolute top-[68%] left-[12%] w-1 h-1 rounded-full bg-white/80 opacity-50" />
        <div className="absolute top-[82%] left-[82%] w-1 h-1 rounded-full bg-white/70 opacity-30" />
        <div className="absolute top-[45%] left-[90%] w-1.5 h-1.5 rounded-full bg-white/90 opacity-40" />
        <div className="absolute top-[75%] left-[30%] w-1 h-1 rounded-full bg-white opacity-20" />
        <div className="absolute top-[20%] left-[45%] w-1 h-1 rounded-full bg-white/50 opacity-40" />
      </div>

      {/* 4. Onboarding Content Container */}
      <div className="relative w-full flex flex-col items-center justify-center z-10">
        <div className="flex flex-col items-center text-center max-w-2xl px-6 animate-[fadeIn_0.5s_ease-out]">
          {/* Stylized Glowing Moon Logo Container */}
          <div className="relative mb-10 flex items-center justify-center">
            <div className="absolute w-24 h-24 rounded-full bg-blue-600/30 blur-2xl" />
            <div className="absolute w-16 h-16 rounded-full bg-sky-500/20 blur-xl" />

            <div className="relative size-12 rounded-md flex items-center justify-center bg-white border border-white/20 shadow-[0_0_30px_rgba(59,130,246,0.6)]">
              {/* Reusable Brand Logo component */}
              <BrandLogo
                className="text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]"
                size={32}
              />
            </div>
          </div>

          {/* Large Premium Welcome Title */}
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            Welcome to Luna
          </h1>

          {/* Sub-headline / Copy */}
          <p className="text-sm sm:text-base md:text-[17px] text-slate-300 font-sans max-w-2xl leading-relaxed mb-10 opacity-90 whitespace-pre-line">
            Luna is your personal desktop assistant powered by local AI. Automate tasks, organize
            your workspace, and chat securely—all entirely offline.
          </p>

          {/* Action Button */}
          <div className="w-full flex justify-center">
            <button
              onClick={onGetStarted}
              className="group relative px-8 py-2 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-[15px] transition-all duration-300 shadow-[0_4px_24px_rgba(59,130,246,0.3)] hover:shadow-[0_8px_32px_rgba(59,130,246,0.5)] active:scale-97 cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Welcome
