import { UI_COLORS, withAlpha } from '@/features/structure/colors'
import { sameResidue } from '@/lib/format'
import type { ResidueKey, ResidueRecord } from '@/types/api'

export const CONTACT_MAP_MAX_SIZE = 360
export const CONTACT_DOWNSAMPLE_THRESHOLD = 3000

const PADDING = { top: 12, right: 16, bottom: 28, left: 28 }

export interface ContactMapGeometry {
  plotX: number
  plotY: number
  plotSize: number
  matrixSize: number
  cellSize: number
  downsampled: boolean
}

export interface ContactMapDrawing {
  geometry: ContactMapGeometry
  pairs: ReadonlySet<string>
}

export interface ContactMapDrawOptions {
  width: number
  height: number
  residues: ResidueRecord[]
  contacts: [number, number][]
  selection: ResidueKey | null
}

export function matrixIndexFor(
  index: number,
  downsampled: boolean,
): number {
  return downsampled ? Math.floor(index / 2) : index
}

export function contactPairKey(first: number, second: number): string {
  return first <= second ? `${first}|${second}` : `${second}|${first}`
}

export function computeContactGeometry(
  width: number,
  height: number,
  residueCount: number,
  downsampled: boolean,
): ContactMapGeometry {
  const availableWidth = Math.max(0, width - PADDING.left - PADDING.right)
  const availableHeight = Math.max(0, height - PADDING.top - PADDING.bottom)
  const plotSize = Math.min(availableWidth, availableHeight)
  const plotX = PADDING.left + (availableWidth - plotSize) / 2
  const plotY = PADDING.top + (availableHeight - plotSize) / 2
  const matrixSize = Math.max(
    1,
    downsampled ? Math.ceil(residueCount / 2) : residueCount,
  )

  return {
    plotX,
    plotY,
    plotSize,
    matrixSize,
    cellSize: plotSize / matrixSize,
    downsampled,
  }
}

function buildPairs(
  contacts: readonly [number, number][],
  residueCount: number,
  downsampled: boolean,
): Set<string> {
  const pairs = new Set<string>()

  for (const [first, second] of contacts) {
    if (
      first < 0 ||
      second < 0 ||
      first >= residueCount ||
      second >= residueCount
    ) {
      continue
    }
    const row = matrixIndexFor(first, downsampled)
    const column = matrixIndexFor(second, downsampled)
    if (row === column) {
      continue
    }
    pairs.add(contactPairKey(row, column))
  }

  return pairs
}

export function drawContactMap(
  ctx: CanvasRenderingContext2D,
  options: ContactMapDrawOptions,
): ContactMapDrawing {
  const { width, height, residues, contacts, selection } = options
  const downsampled = residues.length > CONTACT_DOWNSAMPLE_THRESHOLD
  const geometry = computeContactGeometry(
    width,
    height,
    residues.length,
    downsampled,
  )
  const pairs = buildPairs(contacts, residues.length, downsampled)

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = UI_COLORS.surface
  ctx.fillRect(0, 0, width, height)

  const { plotX, plotY, plotSize, matrixSize, cellSize } = geometry
  if (plotSize <= 0) {
    return { geometry, pairs }
  }

  ctx.fillStyle = UI_COLORS.paper
  ctx.fillRect(plotX, plotY, plotSize, plotSize)

  ctx.fillStyle = withAlpha(UI_COLORS.ink, 0.55)
  for (const key of pairs) {
    const separator = key.indexOf('|')
    const first = Number.parseInt(key.slice(0, separator), 10)
    const second = Number.parseInt(key.slice(separator + 1), 10)
    const firstX = plotX + first * cellSize
    const secondX = plotX + second * cellSize
    const firstY = plotY + first * cellSize
    const secondY = plotY + second * cellSize

    ctx.fillRect(firstX, secondY, cellSize, cellSize)
    ctx.fillRect(secondX, firstY, cellSize, cellSize)
  }

  ctx.strokeStyle = UI_COLORS.line
  ctx.lineWidth = 1
  ctx.strokeRect(
    plotX + 0.5,
    plotY + 0.5,
    Math.max(0, plotSize - 1),
    Math.max(0, plotSize - 1),
  )

  const rawTicks = [
    1,
    Math.max(1, Math.ceil(residues.length / 2)),
    residues.length,
  ]
  const tickOffsets = [0, plotSize / 2, plotSize]
  const ticks = rawTicks
    .map((value, index) => ({ value, offset: tickOffsets[index] }))
    .filter(
      (tick, index, all) =>
        all.findIndex((entry) => entry.value === tick.value) === index,
    )

  ctx.strokeStyle = UI_COLORS.line
  ctx.beginPath()
  for (const tick of ticks) {
    ctx.moveTo(plotX + tick.offset, plotY + plotSize)
    ctx.lineTo(plotX + tick.offset, plotY + plotSize + 4)
  }
  ctx.stroke()

  ctx.fillStyle = UI_COLORS.muted
  ctx.font =
    '10px "IBM Plex Mono", "Noto Sans Mono CJK SC", monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  for (const tick of ticks) {
    ctx.fillText(
      String(tick.value),
      plotX + tick.offset,
      plotY + plotSize + 7,
    )
  }

  if (selection) {
    const current = residues.find((residue) =>
      sameResidue(selection, residue),
    )
    if (current) {
      const matrixIndex = matrixIndexFor(current.index, downsampled)
      if (matrixIndex >= 0 && matrixIndex < matrixSize) {
        const x = plotX + (matrixIndex + 0.5) * cellSize
        const y = plotY + (matrixIndex + 0.5) * cellSize

        ctx.strokeStyle = withAlpha(UI_COLORS.accent, 0.9)
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, plotY)
        ctx.lineTo(x, plotY + plotSize)
        ctx.moveTo(plotX, y)
        ctx.lineTo(plotX + plotSize, y)
        ctx.stroke()
      }
    }
  }

  return { geometry, pairs }
}
