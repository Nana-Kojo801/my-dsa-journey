import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function PrimaryButton({
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...rest}
      className={`cursor-pointer bg-ink px-4.5 py-3.5 font-mono text-[11.5px] font-medium tracking-[0.18em] text-ground transition-colors hover:bg-red disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

export function OutlineButton({
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...rest}
      className={`cursor-pointer border border-ink/28 px-4.5 py-3.5 font-mono text-[11.5px] font-medium tracking-[0.18em] text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

export function TextButton({
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...rest}
      className={`cursor-pointer font-mono text-[10.4px] font-medium tracking-[0.16em] text-red ${className}`}
    >
      {children}
    </button>
  )
}

export function MonoLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint ${className}`}>{children}</div>
  )
}

export function Divider({ className = '' }: { className?: string }) {
  return <div className={`border-b border-ink/14 ${className}`} />
}
