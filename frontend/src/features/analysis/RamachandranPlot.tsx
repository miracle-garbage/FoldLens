import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/EmptyState'
import { UI_COLORS, withAlpha } from '@/features/structure/colors'
import {
  formatAngle,
  formatResidueId,
  residueKeyOf,
  sameResidue,
} from '@/lib/format'
import { useLocale } from '@/lib/use-locale'
import type { ResidueKey, ResidueRecord } from '@/types/api'

import {
  drawRamachandran,
  findNearestPoint,
  isOutlierAngle,
  RAMACHANDRAN_HEIGHT,
  type RamachandranPoint,
} from './draw-ramachandran'

interface RamachandranPlotProps {
  residues: ResidueRecord[]
  selection: ResidueKey | null
  onSelect: (key: ResidueKey) => void
}

interface RamachandranHover {
  key: string
  residue: ResidueRecord
  x: number
  y: number
}

export function RamachandranPlot({
  residues,
  selection,
  onSelect,
}: RamachandranPlotProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const headingId = useId()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointsRef = useRef<RamachandranPoint[]>([])
  const [width, setWidth] = useState(0)
  const [hover, setHover] = useState<RamachandranHover | null>(null)

  const plotted = useMemo(
    () =>
      residues.filter(
        (residue) => residue.phi !== null && residue.psi !== null,
      ),
    [residues],
  )
  const outlierCount = useMemo(
    () =>
      plotted.filter(
        (residue) =>
          residue.phi !== null &&
          residue.psi !== null &&
          isOutlierAngle(residue.phi, residue.psi),
      ).length,
    [plotted],
  )
  const hasPoints = plotted.length > 0

  const selectedResidue = useMemo(
    () =>
      selection
        ? (residues.find((residue) => sameResidue(residue, selection)) ??
          null)
        : null,
    [residues, selection],
  )

  const showMissing =
    selection !== null &&
    (selectedResidue === null ||
      selectedResidue.phi === null ||
      selectedResidue.psi === null)

  useEffect(() => {
    const element = wrapperRef.current
    if (!element) {
      return
    }

    const updateWidth = (nextWidth: number) => {
      setWidth((current) =>
        Math.abs(current - nextWidth) < 0.5 ? current : nextWidth,
      )
    }

    updateWidth(element.getBoundingClientRect().width)
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        updateWidth(entry.contentRect.width)
      }
    })
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || width <= 0 || !hasPoints) {
      pointsRef.current = []
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(RAMACHANDRAN_HEIGHT * dpr)
    context.setTransform(dpr, 0, 0, dpr, 0, 0)

    pointsRef.current = drawRamachandran(context, {
      width,
      height: RAMACHANDRAN_HEIGHT,
      residues,
      selection,
      axisLabels: {
        phi: t('ramachandran.axisPhi'),
        psi: t('ramachandran.axisPsi'),
      },
    })
  }, [width, residues, selection, hasPoints, t])

  function pointAt(event: MouseEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    return findNearestPoint(pointsRef.current, x, y, 10)
  }

  function handleClick(event: MouseEvent<HTMLCanvasElement>) {
    const point = pointAt(event)
    if (!point) {
      return
    }
    onSelect({
      chainId: point.residue.chainId,
      resId: point.residue.resId,
      insCode: point.residue.insCode,
    })
  }

  function handleMouseMove(event: MouseEvent<HTMLCanvasElement>) {
    const point = pointAt(event)
    event.currentTarget.style.cursor = point ? 'pointer' : 'default'

    const next: RamachandranHover | null = point
      ? {
          key: residueKeyOf(point.residue),
          residue: point.residue,
          x: point.x,
          y: point.y,
        }
      : null

    setHover((current) => {
      if (current?.key === next?.key) {
        return current
      }
      return next
    })
  }

  function handleMouseLeave(event: MouseEvent<HTMLCanvasElement>) {
    event.currentTarget.style.cursor = 'default'
    setHover((current) => (current === null ? current : null))
  }

  const tooltipLeft = hover
    ? Math.max(4, Math.min(hover.x + 12, width - 178))
    : 0
  const tooltipTop = hover ? Math.max(4, hover.y - 50) : 0

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2
        id={headingId}
        className="font-display text-[1.125rem] text-ink"
      >
        {t('ramachandran.title')}
      </h2>

      <div ref={wrapperRef} className="relative w-full">
        {hasPoints ? (
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={t('ramachandran.ariaSummary', {
              count: plotted.length,
              outliers: outlierCount,
            })}
            className="block w-full rounded-xs"
            style={{ height: `${RAMACHANDRAN_HEIGHT}px` }}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
        ) : (
          <EmptyState
            title={t('ramachandran.title')}
            hint={t('ramachandran.empty')}
            compact
          />
        )}

        {hover ? (
          <div
            className="pointer-events-none absolute z-10 whitespace-nowrap rounded-xs border border-line bg-surface px-2 py-1 font-mono text-mono-s text-ink"
            style={{ left: tooltipLeft, top: tooltipTop }}
          >
            <p>
              {hover.residue.name3}{' '}
              {formatResidueId(
                hover.residue.resId,
                hover.residue.insCode,
              )}
            </p>
            <p className="text-muted">
              {t('residue.phi')}{' '}
              {formatAngle(hover.residue.phi, locale)} /{' '}
              {t('residue.psi')}{' '}
              {formatAngle(hover.residue.psi, locale)}
            </p>
          </div>
        ) : null}
      </div>

      {showMissing ? (
        <p className="text-body-s text-muted">
          {t('ramachandran.currentMissing')}
        </p>
      ) : null}

      {hasPoints ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-mono-s text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 rounded-full"
              style={{
                backgroundColor: withAlpha(UI_COLORS.muted, 0.4),
              }}
            />
            {t('ramachandran.legendNormal')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: UI_COLORS.danger }}
            />
            {t('ramachandran.legendOutlier')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: UI_COLORS.accent }}
            />
            {t('ramachandran.legendCurrent')}
          </span>
          <span>{t('ramachandran.approximate')}</span>
        </div>
      ) : null}
    </section>
  )
}
