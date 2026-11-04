import { UI_COLORS, withAlpha } from '@/features/structure/colors'
import { sameResidue } from '@/lib/format'
import type { ResidueKey, ResidueRecord } from '@/types/api'

export const RAMACHANDRAN_HEIGHT = 260

const PADDING = { top: 20, right: 20, bottom: 32, left: 46 }

type AnglePoint = readonly [number, number]

/**
 * Coarse, hand-drawn guide regions in (φ, ψ) degree space.
 * These are deliberately approximate and must not be presented as
 * experimentally derived favoured/allowed regions.
 */
export const APPROXIMATE_REGIONS: readonly (readonly AnglePoint[])[] = [
  // α-helix basin.
  [
    [-150, -70],
    [-160, -15],
    [-120, 40],
    [-70, 65],
    [-38, 25],
    [-35, -20],
    [-70, -70],
    [-120, -85],
  ],
  // β-strand and polyproline II band.
  [
    [-178, 85],
    [-178, 178],
    [-58, 178],
    [-48, 142],
    [-70, 100],
    [-115, 82],
  ],
  // Left-handed α-helix.
  [
    [30, -35],
    [35, 80],
    [100, 80],
    [105, -10],
    [70, -50],
  ],
]

export interface RamachandranPoint {
  residue: ResidueRecord
  phi: number
  psi: number
  x: number
  y: number
}

export interface RamachandranDrawOptions {
  width: number
  height: number
  residues: ResidueRecord[]
  selection: ResidueKey | null
  axisLabels: { phi: string; psi: string }
}

function normalizeAngle(value: number): number {
  if (value > 180) {
    return value - 360
  }
  if (value < -180) {
    return value + 360
  }
  return value
}

function clampAngle(value: number): number {
  return Math.min(180, Math.max(-180, normalizeAngle(value)))
}

function pointInPolygon(
  x: number,
  y: number,
  polygon: readonly AnglePoint[],
): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    const crosses =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (crosses) {
      inside = !inside
    }
  }
  return inside
}

export function isOutlierAngle(phi: number, psi: number): boolean {
  const normalizedPhi = normalizeAngle(phi)
  const normalizedPsi = normalizeAngle(psi)
  return !APPROXIMATE_REGIONS.some((region) =>
    pointInPolygon(normalizedPhi, normalizedPsi, region),
  )
}

export function drawRamachandran(
  ctx: CanvasRenderingContext2D,
  options: RamachandranDrawOptions,
): RamachandranPoint[] {
  const { width, height, residues, selection, axisLabels } = options

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = UI_COLORS.surface
  ctx.fillRect(0, 0, width, height)

  const plotWidth = Math.max(0, width - PADDING.left - PADDING.right)
  const plotHeight = Math.max(0, height - PADDING.top - PADDING.bottom)
  if (plotWidth <= 0 || plotHeight <= 0) {
    return []
  }

  const plotX = PADDING.left
  const plotY = PADDING.top

  const xFor = (phi: number): number =>
    plotX + ((clampAngle(phi) + 180) / 360) * plotWidth
  const yFor = (psi: number): number =>
    plotY + ((180 - clampAngle(psi)) / 360) * plotHeight

  ctx.fillStyle = UI_COLORS.paper
  ctx.fillRect(plotX, plotY, plotWidth, plotHeight)

  ctx.save()
  ctx.setLineDash([4, 4])
  ctx.lineWidth = 1
  for (const region of APPROXIMATE_REGIONS) {
    ctx.beginPath()
    region.forEach(([phi, psi], index) => {
      const x = xFor(phi)
      const y = yFor(psi)
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.closePath()
    ctx.fillStyle = withAlpha(UI_COLORS.teal, 0.06)
    ctx.fill()
    ctx.strokeStyle = UI_COLORS.line
    ctx.stroke()
  }
  ctx.restore()

  const ticks = [-180, -90, 0, 90, 180]
  ctx.strokeStyle = UI_COLORS.line
  ctx.lineWidth = 1
  ctx.beginPath()
  for (const value of ticks) {
    const x = xFor(value)
    ctx.moveTo(x, plotY)
    ctx.lineTo(x, plotY + plotHeight)
    const y = yFor(value)
    ctx.moveTo(plotX, y)
    ctx.lineTo(plotX + plotWidth, y)
  }
  ctx.stroke()

  ctx.strokeStyle = UI_COLORS.line
  ctx.strokeRect(
    plotX + 0.5,
    plotY + 0.5,
    Math.max(0, plotWidth - 1),
    Math.max(0, plotHeight - 1),
  )

  ctx.fillStyle = UI_COLORS.muted
  ctx.font =
    '10px "IBM Plex Mono", "Noto Sans Mono CJK SC", monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  for (const value of ticks) {
    ctx.fillText(String(value), xFor(value), plotY + plotHeight + 6)
  }

  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (const value of ticks) {
    ctx.fillText(String(value), plotX - 7, yFor(value))
  }

  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'
  ctx.fillText(axisLabels.phi, width - 2, height - 14)

  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(axisLabels.psi, 2, 2)

  const points: RamachandranPoint[] = []
  for (const residue of residues) {
    if (residue.phi === null || residue.psi === null) {
      continue
    }
    const phi = normalizeAngle(residue.phi)
    const psi = normalizeAngle(residue.psi)
    const x = xFor(phi)
    const y = yFor(psi)
    const outlier = isOutlierAngle(phi, psi)

    ctx.beginPath()
    ctx.arc(x, y, outlier ? 2.4 : 2.2, 0, Math.PI * 2)
    ctx.fillStyle = outlier
      ? UI_COLORS.danger
      : withAlpha(UI_COLORS.muted, 0.4)
    ctx.fill()

    points.push({ residue, phi, psi, x, y })
  }

  if (selection) {
    const current = residues.find((residue) =>
      sameResidue(selection, residue),
    )
    if (current && current.phi !== null && current.psi !== null) {
      const x = xFor(current.phi)
      const y = yFor(current.psi)

      // 2 px surface ring keeps the accent dot legible over the dot field.
      ctx.beginPath()
      ctx.arc(x, y, 6.5, 0, Math.PI * 2)
      ctx.fillStyle = UI_COLORS.surface
      ctx.fill()

      ctx.beginPath()
      ctx.arc(x, y, 4.5, 0, Math.PI * 2)
      ctx.fillStyle = UI_COLORS.accent
      ctx.fill()
    }
  }

  return points
}

export function findNearestPoint(
  points: readonly RamachandranPoint[],
  x: number,
  y: number,
  maxDistance: number,
): RamachandranPoint | null {
  let nearest: RamachandranPoint | null = null
  let nearestSquared = maxDistance * maxDistance

  for (const point of points) {
    const dx = point.x - x
    const dy = point.y - y
    const squared = dx * dx + dy * dy
    if (squared <= nearestSquared) {
      nearest = point
      nearestSquared = squared
    }
  }

  return nearest
}
