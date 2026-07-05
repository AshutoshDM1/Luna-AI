import React from 'react'

export const Logo: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-2 select-none">
      {/* Custom Stylized C logo */}
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)]"
      >
        {/* Main outer crescent representing C */}
        <path
          d="M32 10C29.2 7.5 25.5 6 21.5 6C12.9 6 6 12.9 6 21.5C6 30.1 12.9 37 21.5 37C25.5 37 29.2 35.5 32 33"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        {/* Two parallel horizontal lines representing privacy/encryption bars */}
        <path d="M17 17.5H35" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <path d="M17 25.5H35" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>

      {/* CYPHERS Text wordmark */}
      <span className="text-[38px] font-black tracking-[0.15em] text-white leading-none font-sans drop-shadow-[0_2px_8px_rgba(255,255,255,0.2)] ml-1">
        YPHERS
      </span>
    </div>
  )
}
