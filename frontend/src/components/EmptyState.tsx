interface EmptyStateProps {
  title: string
  hint?: string
  compact?: boolean
  dark?: boolean
}

export function EmptyState({
  title,
  hint,
  compact = false,
  dark = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'gap-1 py-4' : 'gap-2 py-10'
      }`}
    >
      <p className={`text-body-s ${dark ? 'text-surface' : 'text-ink'}`}>
        {title}
      </p>
      {hint ? (
        <p
          className={`max-w-[42ch] text-body-s ${
            dark ? 'text-surface/60' : 'text-muted'
          }`}
        >
          {hint}
        </p>
      ) : null}
    </div>
  )
}
