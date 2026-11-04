import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/EmptyState'
import { UI_COLORS, withAlpha } from '@/features/structure/colors'
import { formatResidueId } from '@/lib/format'
import type { ResidueKey, ResidueRecord } from '@/types/api'

import {
  CONTACT_DOWNSAMPLE_THRESHOLD,
  CONTACT_MAP_MAX_SIZE,
  contactPairKey,
  drawContactMap,
  matrixIndexFor,
  type ContactMapDrawing,
  type ContactMapGeometry,
} from './draw-contact-map'

interface ContactMapProps {
  residues: ResidueRecord[]
  contacts: [number, number][]
  selection: ResidueKey | null
  onSelect: (key: ResidueKey) => void
}

interface ContactHover {
  key: string
  first: ResidueRecord
  second: ResidueRecord
  isContact: boolean
  x: number
  y: number
}

export function ContactMap({
  residues,
  contacts,
  selection,
  onSelect,
}: ContactMapProps) {
  const { t } = useTranslation()
  const headingId = useId()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef<ContactMapDrawing | null>(null)
  const [width, setWidth] = useState(0)
  const [hover, setHover] = useState<ContactHover | null>(null)

  const downsampled = residues.length > CONTACT_DOWNSAMPLE_THRESHOLD
  const isEmpty = residues.length === 0 || contacts.length === 0
  const height = Math.min(width, CONTACT_MAP_MAX_SIZE)

  const residueByRow = useMemo(() => {
    const map = new Map<number, ResidueRecord>()
    for (const residue of residues) {
      const row = matrixIndexFor(residue.index, downsampled)
      if (!map.has(row)) {
        map.set(row, residue)
      }
    }
    return map
  }, [residues, downsampled])

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
    if (!canvas || width <= 0 || isEmpty) {
      drawingRef.current = null
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      drawingRef.current = null
      return
    }

    const dpr = window.devicePixelRatio || 1
    const cssHeight = Math.min(width, CONTACT_MAP_MAX_SIZE)
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(cssHeight * dpr)
    context.setTransform(dpr, 0, 0, dpr, 0, 0)

    drawingRef.current = drawContactMap(context, {
      width,
      height: cssHeight,
      residues,
      contacts,
      selection,
    })
  }, [width, residues, contacts, selection, isEmpty])

  function cellAt(
    event: MouseEvent<HTMLCanvasElement>,
  ): { row: number; col: number; geometry: ContactMapGeometry } | null {
    const drawing = drawingRef.current
    if (!drawing || drawing.geometry.cellSize <= 0) {
      return null
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const { geometry } = drawing

    if (
      x < geometry.plotX ||
      x > geometry.plotX + geometry.plotSize ||
      y < geometry.plotY ||
      y > geometry.plotY + geometry.plotSize
    ) {
      return null
    }

    const row = Math.floor((y - geometry.plotY) / geometry.cellSize)
    const col = Math.floor((x - geometry.plotX) / geometry.cellSize)
    if (
      row < 0 ||
      col < 0 ||
      row >= geometry.matrixSize ||
      col >= geometry.matrixSize
    ) {
      return null
    }

    return { row, col, geometry }
  }

  function handleClick(event: MouseEvent<HTMLCanvasElement>) {
    const cell = cellAt(event)
    if (!cell) {
      return
    }
    const residue = residueByRow.get(cell.row)
    if (!residue) {
      return
    }
    onSelect({
      chainId: residue.chainId,
      resId: residue.resId,
      insCode: residue.insCode,
    })
  }

  function handleMouseMove(event: MouseEvent<HTMLCanvasElement>) {
    const drawing = drawingRef.current
    const cell = cellAt(event)

    if (!drawing || !cell) {
      event.currentTarget.style.cursor = 'default'
      setHover((current) => (current === null ? current : null))
      return
    }

    const first = residueByRow.get(cell.row)
    const second = residueByRow.get(cell.col)
    event.currentTarget.style.cursor = 'crosshair'

    if (!first || !second) {
      setHover((current) => (current === null ? current : null))
      return
    }

    const key = `${cell.row}|${cell.col}`
    setHover((current) => {
      if (current?.key === key) {
        return current
      }
      return {
        key,
        first,
        second,
        isContact: drawing.pairs.has(
          contactPairKey(cell.row, cell.col),
        ),
        x:
          cell.geometry.plotX +
          (cell.col + 0.5) * cell.geometry.cellSize,
        y:
          cell.geometry.plotY +
          (cell.row + 0.5) * cell.geometry.cellSize,
      }
    })
  }

  function handleMouseLeave(event: MouseEvent<HTMLCanvasElement>) {
    event.currentTarget.style.cursor = 'default'
    setHover((current) => (current === null ? current : null))
  }

  const tooltipLeft = hover
    ? Math.max(4, Math.min(hover.x + 12, width - 220))
    : 0
  const tooltipTop = hover ? Math.max(4, hover.y - 62) : 0

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2
        id={headingId}
        className="font-display text-[1.125rem] text-ink"
      >
        {t('contact.title')}
      </h2>

      <div ref={wrapperRef} className="relative w-full">
        {isEmpty ? (
          <EmptyState
            title={t('contact.title')}
            hint={t('contact.empty')}
            compact
          />
        ) : (
          <>
            <canvas
              ref={canvasRef}
              role="img"
              aria-label={t('contact.ariaSummary', {
                count: residues.length,
                contacts: contacts.length,
              })}
              className="block w-full rounded-xs"
              style={{
                aspectRatio: '1 / 1',
                maxHeight: `${CONTACT_MAP_MAX_SIZE}px`,
                height: height > 0 ? `${height}px` : undefined,
              }}
              onClick={handleClick}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {hover ? (
              <div
                className="pointer-events-none absolute z-10 whitespace-nowrap rounded-xs border border-line bg-surface px-2 py-1 font-mono text-mono-s text-ink"
                style={{ left: tooltipLeft, top: tooltipTop }}
              >
                <p>
                  {t('contact.hover', {
                    a: `${hover.first.name3} ${formatResidueId(
                      hover.first.resId,
                      hover.first.insCode,
                    )}`,
                    b: `${hover.second.name3} ${formatResidueId(
                      hover.second.resId,
                      hover.second.insCode,
                    )}`,
                  })}
                </p>
                <p
                  className={
                    hover.isContact ? 'text-ink' : 'text-muted'
                  }
                >
                  {hover.isContact
                    ? t('contact.legendContact')
                    : t('contact.legendNone')}
                </p>
              </div>
            ) : null}
          </>
        )}
      </div>

      {isEmpty ? null : (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-mono-s text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5"
              style={{
                backgroundColor: withAlpha(UI_COLORS.ink, 0.55),
              }}
            />
            {t('contact.legendContact')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 border border-line"
              style={{ backgroundColor: UI_COLORS.surface }}
            />
            {t('contact.legendNone')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: UI_COLORS.accent }}
            />
            {t('contact.legendCurrent')}
          </span>
          <span>{t('contact.threshold')}</span>
          {downsampled ? (
            <span className="text-warning">
              {t('contact.downsampled')}
            </span>
          ) : null}
        </div>
      )}
    </section>
  )
}
