import React from 'react'

export const WaitlistButton: React.FC = () => {
  return (
    <div className="flex items-center w-full max-w-2xl px-4 select-none">
      {/* Left Line */}
      <div className="flex-1 h-[1px] bg-slate-800/30" />

      {/* Left Cross Marks */}
      <div className="flex items-center gap-1 mx-4 text-slate-800/40 font-mono text-xs font-semibold">
        <span>×</span>
        <span>×</span>
      </div>

      {/* Join The Waitlist Button */}
      <button className="relative group px-9 py-3 rounded-full bg-[#1b1b1f] hover:bg-[#25252a] text-white font-medium text-sm transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.4)] active:scale-98 border border-white/10 hover:border-white/20">
        {/* Glow border ring */}
        <span className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md -z-10" />
        Join The Waitlist
      </button>

      {/* Right Cross Marks */}
      <div className="flex items-center gap-1 mx-4 text-slate-800/40 font-mono text-xs font-semibold">
        <span>×</span>
        <span>×</span>
      </div>

      {/* Right Line */}
      <div className="flex-1 h-[1px] bg-slate-800/30" />
    </div>
  )
}
