import React from 'react'

export interface BrandButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

export const BrandButton: React.FC<BrandButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <button
      className={`px-6 py-2.5 rounded-lg bg-linear-to-b from-violet-500 to-indigo-500 text-white font-semibold text-sm active:scale-[0.98] shadow-md border border-violet-500/20 transition-all duration-200 cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default BrandButton
