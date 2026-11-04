import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-ink text-surface hover:bg-ink disabled:opacity-40',
  ghost:
    'border border-line bg-transparent text-ink hover:bg-paper disabled:opacity-40',
}

export function Button({
  variant = 'ghost',
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-sm px-4 text-body-s font-medium transition-colors duration-[180ms] ease-instrument ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
