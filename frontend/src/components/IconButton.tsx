import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  children: ReactNode
}

export function IconButton({
  label,
  className = '',
  type = 'button',
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex size-8 items-center justify-center rounded-sm text-ink transition-colors duration-[180ms] ease-instrument hover:bg-paper disabled:opacity-40 ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
