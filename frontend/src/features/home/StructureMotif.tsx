import { useTranslation } from 'react-i18next'

export function StructureMotif() {
  const { t } = useTranslation()
  return (
    <div className="relative mx-auto w-full max-w-[420px] lg:max-w-none">
      <svg
        viewBox="0 0 480 360"
        role="img"
        aria-label={t('home.figure.caption')}
        className="h-auto w-full"
      >
        <rect
          x="1"
          y="1"
          width="478"
          height="358"
          rx="12"
          className="fill-surface stroke-line"
          strokeWidth="1"
        />
        <g
          fill="none"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="stroke-ink/70"
        >
          <path d="M78 246 C118 118, 176 110, 208 218 S 286 330, 330 214 S 386 104, 418 172" />
          <path d="M64 258 C106 140, 166 132, 196 232 S 278 342, 320 228 S 378 126, 408 190" />
          <path d="M96 232 C130 138, 180 132, 214 214" className="stroke-teal" />
        </g>
        <g className="stroke-line" strokeWidth="1">
          <line x1="48" y1="300" x2="432" y2="300" />
          <line x1="48" y1="300" x2="48" y2="292" />
          <line x1="144" y1="300" x2="144" y2="292" />
          <line x1="240" y1="300" x2="240" y2="292" />
          <line x1="336" y1="300" x2="336" y2="292" />
          <line x1="432" y1="300" x2="432" y2="292" />
        </g>
        <circle cx="208" cy="218" r="5" className="fill-accent" />
        <circle
          cx="208"
          cy="218"
          r="10"
          fill="none"
          strokeWidth="1"
          className="stroke-accent/40"
        />
        <text
          x="48"
          y="332"
          className="fill-muted font-mono text-[11px] tracking-[0.08em]"
        >
          1CRN
        </text>
        <text
          x="432"
          y="332"
          textAnchor="end"
          className="fill-muted font-mono text-[11px] tracking-[0.08em]"
        >
          CRAMBIN
        </text>
      </svg>
      <p className="mt-3 font-mono text-[0.8125rem] uppercase leading-[1.4] tracking-[0.08em] text-muted">
        {t('home.figure.caption')}
      </p>
    </div>
  )
}
