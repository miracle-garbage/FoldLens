import { useTranslation } from 'react-i18next'

import { Button } from '@/components/Button'
import {
  DASH,
  formatAngle,
  formatBFactor,
  formatHydrophobicity,
  formatResidueId,
} from '@/lib/format'
import {
  keyOfResidue,
  resolveSelection,
  type ResidueIndex,
} from '@/lib/residue-index'
import { useLocale } from '@/lib/use-locale'
import type { EntryAnalysis, ResidueKey, Sse } from '@/types/api'

const SSE_DOT: Record<Sse, string> = {
  helix: 'bg-helix',
  strand: 'bg-strand',
  coil: 'bg-coil',
}

interface ResidueCardProps {
  analysis: EntryAnalysis
  index: ResidueIndex
  selection: ResidueKey | null
  onSelect: (key: ResidueKey) => void
}

function Readout({
  label,
  value,
  missingTitle,
}: {
  label: string
  value: string
  missingTitle?: string
}) {
  const isMissing = value === DASH
  return (
    <div>
      <dt className="font-mono text-mono-s uppercase tracking-[0.06em] text-muted">
        {label}
      </dt>
      <dd
        title={isMissing ? missingTitle : undefined}
        className={`mt-0.5 font-mono text-[0.9375rem] tabular ${
          isMissing ? 'text-muted' : 'text-ink'
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

export function ResidueCard({
  analysis,
  index,
  selection,
  onSelect,
}: ResidueCardProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const selected = resolveSelection(index, selection)

  if (!selected) {
    const example =
      analysis.residues.find(
        (residue) => residue.phi !== null && residue.psi !== null,
      ) ?? analysis.residues[0]

    return (
      <article className="border-l-[3px] border-transparent bg-surface px-5 py-5">
        <p className="text-body-s font-medium text-ink">
          {t('residue.emptyTitle')}
        </p>
        <p className="mt-1 max-w-[48ch] text-body-s text-muted">
          {t('residue.emptyHint')}
        </p>
        {example ? (
          <Button
            className="mt-3"
            onClick={() => onSelect(keyOfResidue(example))}
          >
            {t('actions.exampleResidue')}
          </Button>
        ) : null}
      </article>
    )
  }

  if (selected.kind === 'ligand') {
    const ligand = selected.ligand
    return (
      <article className="border-l-[3px] border-accent bg-surface px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[1.125rem] font-medium text-ink">
              {ligand.compId} {ligand.resId}
              {ligand.insCode}
            </p>
            <p className="mt-0.5 text-body-s text-muted">
              {t('residue.typeLigand')} ·{' '}
              {t('residue.chainLabel', { chain: ligand.chainId })}
            </p>
          </div>
          <span className="rounded-xs border border-line px-1.5 py-0.5 font-mono text-mono-s text-muted">
            {t('residue.typeLigand')}
          </span>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
          <Readout label={t('residue.ligandName')} value={ligand.name} />
          <Readout
            label={t('residue.ligandAtoms')}
            value={String(ligand.atomCount)}
          />
          <Readout label={t('residue.phi')} value={t('residue.notApplicable')} />
          <Readout label={t('residue.psi')} value={t('residue.notApplicable')} />
        </dl>
      </article>
    )
  }

  const residue = selected.residue
  const residueId = formatResidueId(residue.resId, residue.insCode)

  return (
    <article className="border-l-[3px] border-accent bg-surface px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[1.125rem] font-medium text-ink">
            {residue.name3} {residueId}
          </p>
          <p className="mt-0.5 text-body-s text-muted">
            {t('residue.typeProtein')} ·{' '}
            {t('residue.chainLabel', { chain: residue.chainId })}
            {residue.insCode
              ? ` · ${t('residue.insCode', { code: residue.insCode })}`
              : ''}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-xs border border-line px-1.5 py-0.5 font-mono text-mono-s text-ink">
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${SSE_DOT[residue.sse]}`}
          />
          {t(`residue.sse.${residue.sse}`)}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        <Readout
          label={t('residue.phi')}
          value={formatAngle(residue.phi, locale)}
          missingTitle={t('residue.dihedralMissing')}
        />
        <Readout
          label={t('residue.psi')}
          value={formatAngle(residue.psi, locale)}
          missingTitle={t('residue.dihedralMissing')}
        />
        <Readout
          label={t('residue.bFactor')}
          value={formatBFactor(residue.bFactor, locale)}
        />
        <Readout
          label={t('residue.hydrophobicity')}
          value={formatHydrophobicity(residue.hydrophobicity, locale)}
        />
      </dl>
    </article>
  )
}
