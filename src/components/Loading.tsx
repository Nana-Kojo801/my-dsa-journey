export function Ticker({ label, className = '' }: { label: string; className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="animate-tick h-1.5 w-1.5 shrink-0 rounded-full bg-red" />
      <div className="font-mono text-[10.4px] font-medium tracking-[0.18em] text-faint">{label}</div>
    </div>
  )
}
