/**
 * Every colour used by the 3D view and the Canvas plots lives here.
 * UI surfaces keep using the Tailwind tokens from DESIGN.md.
 */

import type { Sse } from '@/types/api'

export const UI_COLORS = {
  paper: '#F2EFE7',
  surface: '#FAF8F3',
  ink: '#1A1917',
  muted: '#6B675F',
  line: '#D8D2C4',
  accent: '#D9482B',
  accentInk: '#B83A22',
  teal: '#2A7F7A',
  viewport: '#0C0F14',
  viewportGrid: '#1D232C',
  warning: '#B7791F',
  danger: '#B42318',
  success: '#2F7D5B',
} as const

export const SSE_COLORS: Record<Sse, string> = {
  helix: '#E0523B',
  strand: '#3E9B94',
  coil: '#9A958B',
}

/** Eight distinguishable chain colours on the dark viewport. */
export const CHAIN_COLORS = [
  '#E0523B',
  '#3E9B94',
  '#D9A441',
  '#7C8CC9',
  '#B77FBF',
  '#6FAF5F',
  '#C46B8C',
  '#5FA8D3',
] as const

export const ELEMENT_COLORS: Record<string, string> = {
  C: '#9AA0A6',
  N: '#5B8DEF',
  O: '#E0523B',
  S: '#D9A441',
  P: '#E08A3C',
  H: '#E8E6E1',
  FE: '#C96A3B',
  ZN: '#8C8C8C',
  CL: '#6FAF5F',
  NA: '#B77FBF',
  MG: '#6FAF5F',
  CA: '#6FAF5F',
}

export const SELECTED_STYLE = {
  color: '#D9482B',
  labelText: '#FAF8F3',
} as const

const HYDROPHOBICITY_LOW = '#4C7FA8'
const HYDROPHOBICITY_MID = '#E8E2D5'
const HYDROPHOBICITY_HIGH = '#D9822B'

/** N → C rainbow: blue → teal → green → gold → vermilion. */
const POSITION_STOPS = [
  '#4C7FA8',
  '#3E9B94',
  '#7FAF5F',
  '#D9A441',
  '#E0523B',
] as const

const CHARGE_NEGATIVE = '#E0523B'
const CHARGE_POSITIVE = '#5B8DEF'
const CHARGE_NEUTRAL = '#CFC9BE'

const BFACTOR_LOW = '#2A7F7A'
const BFACTOR_MID = '#D9A441'
const BFACTOR_HIGH = '#E0523B'

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '')
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ]
}

function rgbToHex(rgb: [number, number, number]): string {
  return `#${rgb
    .map((channel) =>
      Math.round(Math.min(255, Math.max(0, channel)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
    .toUpperCase()}`
}

export function mixColors(from: string, to: string, amount: number): string {
  const start = hexToRgb(from)
  const end = hexToRgb(to)
  const clamped = Math.min(1, Math.max(0, amount))
  return rgbToHex([
    start[0] + (end[0] - start[0]) * clamped,
    start[1] + (end[1] - start[1]) * clamped,
    start[2] + (end[2] - start[2]) * clamped,
  ])
}

export function withAlpha(hex: string, alpha: number): string {
  const [red, green, blue] = hexToRgb(hex)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

export function colorForChain(chainId: string): string {
  let hash = 0
  for (const character of chainId) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  }
  return CHAIN_COLORS[hash % CHAIN_COLORS.length]
}

export function colorForElement(element: string | undefined): string {
  if (!element) {
    return ELEMENT_COLORS.C
  }
  return ELEMENT_COLORS[element.toUpperCase()] ?? ELEMENT_COLORS.C
}

/** Kyte–Doolittle range is fixed at [-4.5, 4.5] by the architecture doc. */
export function colorForHydrophobicity(value: number | null): string {
  if (value === null) {
    return UI_COLORS.muted
  }
  const normalized = (Math.min(4.5, Math.max(-4.5, value)) + 4.5) / 9
  if (normalized < 0.5) {
    return mixColors(HYDROPHOBICITY_LOW, HYDROPHOBICITY_MID, normalized * 2)
  }
  return mixColors(
    HYDROPHOBICITY_MID,
    HYDROPHOBICITY_HIGH,
    (normalized - 0.5) * 2,
  )
}

/**
 * Rainbow along one chain's sequence, N-terminus (0) to C-terminus (count - 1).
 * Each chain restarts the gradient so every subunit's direction stays legible.
 */
export function colorForPosition(index: number, count: number): string {
  if (count <= 1) {
    return POSITION_STOPS[0]
  }
  const normalized = Math.min(1, Math.max(0, index / (count - 1)))
  const scaled = normalized * (POSITION_STOPS.length - 1)
  const segment = Math.min(
    POSITION_STOPS.length - 2,
    Math.floor(scaled),
  )
  return mixColors(
    POSITION_STOPS[segment],
    POSITION_STOPS[segment + 1],
    scaled - segment,
  )
}

/**
 * Acidic residues (Asp/Glu) red, basic residues (Lys/Arg) blue.
 * Histidine is left neutral: its protonation is environment-dependent, so
 * colouring it as charged would overstate the structure data.
 */
export function colorForCharge(name3: string | null | undefined): string {
  if (!name3) {
    return CHARGE_NEUTRAL
  }
  const normalized = name3.toUpperCase()
  if (normalized === 'ASP' || normalized === 'GLU') {
    return CHARGE_NEGATIVE
  }
  if (normalized === 'LYS' || normalized === 'ARG') {
    return CHARGE_POSITIVE
  }
  return CHARGE_NEUTRAL
}

export function colorForBFactor(
  value: number | null,
  minimum: number,
  maximum: number,
): string {
  if (value === null) {
    return UI_COLORS.muted
  }
  if (maximum <= minimum) {
    return BFACTOR_MID
  }
  const normalized = (value - minimum) / (maximum - minimum)
  if (normalized < 0.5) {
    return mixColors(BFACTOR_LOW, BFACTOR_MID, normalized * 2)
  }
  return mixColors(BFACTOR_MID, BFACTOR_HIGH, (normalized - 0.5) * 2)
}
