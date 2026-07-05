import React from 'react'

export const Badge: React.FC = () => {
  return (
    <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.05)] select-none">
      {/* Solana Badge Part */}
      <div className="flex items-center gap-2">
        <svg
          width="14"
          height="12"
          viewBox="0 0 399 328"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M312.9 0H79.6L0 79.6H233.3L312.9 0Z" fill="url(#solana-grad)" />
          <path d="M79.6 123.7H312.9L392.5 203.3H159.2L79.6 123.7Z" fill="url(#solana-grad)" />
          <path d="M312.9 247.9H79.6L0 327.5H233.3L312.9 247.9Z" fill="url(#solana-grad)" />
          <defs>
            <linearGradient
              id="solana-grad"
              x1="392.5"
              y1="0"
              x2="0"
              y2="327.5"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#00FFA3" />
              <stop offset="1" stopColor="#DC1FFF" />
            </linearGradient>
          </defs>
        </svg>
        <span className="text-[10px] font-bold tracking-[0.2em] text-slate-800 uppercase font-mono">
          Solana
        </span>
      </div>

      {/* Separator Line */}
      <div className="h-4 w-[1px] bg-slate-800/30" />

      {/* Arcium Badge Part */}
      <div className="flex items-center gap-2">
        <svg
          width="13"
          height="13"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Arcium stylized A/chevron logo */}
          <path d="M50 12 L15 80 L29 80 L50 36 L71 80 L85 80 Z" fill="#a855f7" />
          <path d="M50 48 L37 74 H63 Z" fill="#e9d5ff" />
        </svg>
        <span className="text-[10px] font-bold tracking-[0.2em] text-slate-800 uppercase font-mono">
          Arcium
        </span>
      </div>
    </div>
  )
}
