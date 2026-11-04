import type { ResidueKey } from '@/types/api'

export const DASH = '—'

function formatWithDigits(
  value: number,
  digits: number,
  locale: string,
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
    value,
  )
}

export function formatAngle(value: number | null, locale: string): string {
  if (value === null) {
    return DASH
  }
  return `${formatWithDigits(value, 1, locale).replace('-', '−')}°`
}

export function formatResolution(
  value: number | null,
  locale: string,
  unit = 'Å',
): string {
  if (value === null) {
    return DASH
  }
  return `${formatWithDigits(value, 2, locale)} ${unit}`
}

export function formatBFactor(value: number | null, locale: string): string {
  if (value === null) {
    return DASH
  }
  return `${formatWithDigits(value, 2, locale)} Å²`
}

export function formatHydrophobicity(
  value: number | null,
  locale: string,
): string {
  if (value === null) {
    return DASH
  }
  return formatWithDigits(value, 2, locale)
}

export function formatPercent(
  fraction: number | null,
  locale: string,
): string {
  if (fraction === null) {
    return DASH
  }
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(fraction)
}

export function formatDate(isoDate: string | null, locale: string): string {
  if (!isoDate) {
    return DASH
  }
  const parsed = new Date(`${isoDate}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) {
    return isoDate
  }
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(parsed)
}

export function formatResidueId(resId: number, insCode: string): string {
  return insCode ? `${resId}${insCode}` : `${resId}`
}

export function residueKeyOf(key: ResidueKey): string {
  return `${key.chainId}|${key.resId}|${key.insCode}`
}

export function sameResidue(
  first: ResidueKey | null,
  second: ResidueKey | null,
): boolean {
  if (!first || !second) {
    return first === second
  }
  return (
    first.chainId === second.chainId &&
    first.resId === second.resId &&
    first.insCode === second.insCode
  )
}
