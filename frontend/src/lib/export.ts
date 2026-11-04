import type { ResidueRecord } from '@/types/api'

const CSV_COLUMNS = [
  'index',
  'chain',
  'res_id',
  'ins_code',
  'name3',
  'name1',
  'sse',
  'phi',
  'psi',
  'b_factor',
  'hydrophobicity',
] as const

function escapeCsv(value: string | number | null): string {
  if (value === null) {
    return ''
  }
  const text = String(value)
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}

export function buildResidueCsv(residues: ResidueRecord[]): string {
  const rows = residues.map((residue) =>
    [
      residue.index,
      residue.chainId,
      residue.resId,
      residue.insCode,
      residue.name3,
      residue.name1,
      residue.sse,
      residue.phi,
      residue.psi,
      residue.bFactor,
      residue.hydrophobicity,
    ]
      .map(escapeCsv)
      .join(','),
  )
  return [CSV_COLUMNS.join(','), ...rows].join('\n')
}

export function downloadText(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function downloadDataUri(dataUri: string, filename: string): void {
  const anchor = document.createElement('a')
  anchor.href = dataUri
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
}

export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.append(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}
