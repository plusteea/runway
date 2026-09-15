import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger' | 'secondary'
}) {
  const styles = {
    primary:
      'rounded-[12px] bg-primary text-on-primary hover:brightness-110 active:brightness-95 disabled:opacity-40',
    secondary:
      'rounded-[12px] glass text-ink hover:bg-white/12 disabled:opacity-40',
    ghost: 'rounded-[12px] bg-transparent text-ink hover:bg-white/10 disabled:opacity-40',
    danger: 'rounded-[12px] bg-bad text-white hover:brightness-110 disabled:opacity-40',
  } as const

  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center px-4 text-[15px] font-medium transition-[filter,background-color] duration-150 ease-[var(--ease-out)] ${styles[variant]} ${className}`}
      {...props}
    />
  )
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      {children}
      {error ? (
        <span className="text-[13px] text-bad">{error}</span>
      ) : hint ? (
        <span className="text-[13px] text-muted">{hint}</span>
      ) : null}
    </label>
  )
}

export const inputClass =
  'glass w-full rounded-[12px] px-3.5 py-3 text-ink placeholder:text-muted outline-none transition-colors duration-150 focus:border-primary'

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputClass} {...props} />
}

export function Screen({
  title,
  onBack,
  children,
  footer,
}: {
  title: string
  onBack?: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="flex h-full min-h-0 flex-col px-6 py-6">
      <header className="mb-6 flex shrink-0 items-center gap-2">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="-ml-2 inline-flex size-11 items-center justify-center rounded-[12px] text-ink hover:bg-white/10"
            aria-label="Назад"
          >
            <ChevronLeft size={22} />
          </button>
        ) : null}
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      {footer ? <div className="mt-6 shrink-0">{footer}</div> : null}
    </div>
  )
}

export function ToneDot({ tone }: { tone: 'ok' | 'warn' | 'bad' | 'info' }) {
  const color = {
    ok: 'bg-primary',
    warn: 'bg-warn',
    bad: 'bg-bad',
    info: 'bg-muted',
  }[tone]
  return <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${color}`} />
}
