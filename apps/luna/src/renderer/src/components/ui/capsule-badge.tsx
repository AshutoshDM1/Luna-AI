export interface CapsuleBadgeProps {
  pillText: string
  label: string
  className?: string
}

export const CapsuleBadge: React.FC<CapsuleBadgeProps> = ({ pillText, label, className = '' }) => {
  return (
    <div
      className={`inline-flex items-center justify-center gap-2 px-1.5 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-[11px] font-sans text-slate-300 select-none ${className}`}
    >
      <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] tracking-wide uppercase">
        {pillText}
      </span>
      <span className="pr-2.5 tracking-tight text-white/80">{label}</span>
    </div>
  )
}
