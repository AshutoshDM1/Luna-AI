import React from 'react'
import { BackgroundGrid } from './components/BackgroundGrid'
import { Logo } from './components/Logo'
import { Badge } from './components/Badge'
import { WaitlistButton } from './components/WaitlistButton'

export const Home: React.FC = () => {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden font-sans">
      {/* Premium Background Grid & Glow */}
      <BackgroundGrid />

      {/* Main Content Wrapper */}
      <div className="flex flex-col items-center text-center max-w-4xl px-6 z-10 select-none">
        {/* Top Logo */}
        <div className="mb-8 animate-fade-in">
          <Logo />
        </div>

        {/* Solana & Arcium Badge */}
        <div className="mb-10 animate-fade-in-delay-1">
          <Badge />
        </div>

        {/* Main Sleek Headline */}
        <h1 className="text-5xl sm:text-7xl font-semibold tracking-tight text-white mb-6 drop-shadow-[0_4px_16px_rgba(255,255,255,0.1)] leading-[1.1] animate-fade-in-delay-2">
          prediction meets privacy
        </h1>

        {/* Code/Monospace Styled Sub-headline */}
        <p className="text-sm sm:text-base md:text-lg text-white/90 font-mono max-w-xl leading-relaxed mb-12 opacity-90 tracking-wide whitespace-pre-line animate-fade-in-delay-3">
          Encrypted prediction markets on Solana where{'\n'}
          your forecasts stay private until settlement.
        </p>

        {/* Waitlist Call To Action Button & Flanking Layout */}
        <div className="w-full flex justify-center animate-fade-in-delay-4">
          <WaitlistButton />
        </div>
      </div>
    </div>
  )
}

export default Home
