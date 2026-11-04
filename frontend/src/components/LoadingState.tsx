interface LoadingStateProps {
  label: string
  dark?: boolean
  compact?: boolean
}

export function LoadingState({
  label,
  dark = false,
  compact = false,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center ${
        compact ? 'gap-2 py-4' : 'gap-4 py-12'
      }`}
    >
      <span
        aria-hidden="true"
        className={`block h-px w-16 overflow-hidden ${
          dark ? 'bg-viewport-grid' : 'bg-line'
        }`}
      >
        <span
          className={`block h-px w-6 animate-[breathe_1.2s_ease-in-out_infinite] ${
            dark ? 'bg-surface' : 'bg-ink'
          }`}
        />
      </span>
      <span
        className={`text-body-s ${dark ? 'text-surface/70' : 'text-muted'}`}
      >
        {label}
      </span>
    </div>
  )
}

interface SkeletonProps {
  lines?: number
  dark?: boolean
}

export function Skeleton({ lines = 3, dark = false }: SkeletonProps) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2">
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className={`h-3 animate-breathe rounded-xs ${
            dark ? 'bg-viewport-grid' : 'bg-line'
          }`}
          style={{ width: `${72 + ((index * 13) % 24)}%` }}
        />
      ))}
    </div>
  )
}
