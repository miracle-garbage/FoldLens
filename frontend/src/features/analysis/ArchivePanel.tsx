import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/EmptyState'
import {
  DASH,
  formatDate,
  formatNumber,
  formatPercent,
  formatResolution,
} from '@/lib/format'
import { useLocale } from '@/lib/use-locale'
import type { EntryAnalysis, MissingRange } from '@/types/api'

interface ArchivePanelProps {
  analysis: EntryAnalysis
}

function groupMissing(ranges: MissingRange[]): [string, MissingRange[]][] {
  const groups = new Map<string, MissingRange[]>()
  for (const range of ranges) {
    const group = groups.get(range.chainId)
    if (group) {
      group.push(range)
    } else {
      groups.set(range.chainId, [range])
    }
  }
  return [...groups.entries()]
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-mono-s uppercase tracking-[0.06em] text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 font-mono text-[0.9375rem] tabular text-ink">
        {value === DASH ? <span className="text-muted">{DASH}</span> : value}
      </dd>
    </div>
  )
}

export function ArchivePanel({ analysis }: ArchivePanelProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const { meta, stats } = analysis
  const missingGroups = groupMissing(meta.missingResidues)

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="archive-overview">
        <h3
          id="archive-overview"
          className="mb-3 font-display text-[1.125rem] text-ink"
        >
          {t('workspace.archive.overview')}
        </h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
          <Field
            label={t('workspace.archive.method')}
            value={meta.method ?? DASH}
          />
          <Field
            label={t('workspace.archive.resolution')}
            value={formatResolution(meta.resolution, locale)}
          />
          <Field
            label={t('workspace.archive.rfree')}
            value={
              meta.rFree === null
                ? DASH
                : new Intl.NumberFormat(locale, {
                    minimumFractionDigits: 3,
                    maximumFractionDigits: 3,
                  }).format(meta.rFree)
            }
          />
          <Field
            label={t('workspace.archive.deposited')}
            value={formatDate(meta.depositedAt, locale)}
          />
          <Field
            label={t('workspace.archive.chains')}
            value={formatNumber(meta.chainCount, locale)}
          />
          <Field
            label={t('workspace.archive.residues')}
            value={formatNumber(meta.residueCount, locale)}
          />
          <Field
            label={t('workspace.archive.atoms')}
            value={formatNumber(meta.atomCount, locale)}
          />
          <Field
            label={t('workspace.archive.ligands')}
            value={formatNumber(meta.ligands.length, locale)}
          />
        </dl>
      </section>

      <section aria-labelledby="archive-stats">
        <h3
          id="archive-stats"
          className="mb-3 font-display text-[1.125rem] text-ink"
        >
          {t('workspace.archive.stats')}
        </h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <dt className="flex items-center gap-1.5 text-body-s text-muted">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-helix"
              />
              {t('workspace.archive.helix')}
            </dt>
            <dd className="font-mono text-[0.9375rem] tabular text-ink">
              {formatNumber(stats.helixCount, locale)}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-body-s text-muted">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-strand"
              />
              {t('workspace.archive.strand')}
            </dt>
            <dd className="font-mono text-[0.9375rem] tabular text-ink">
              {formatNumber(stats.strandCount, locale)}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-body-s text-muted">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-coil"
              />
              {t('workspace.archive.coil')}
            </dt>
            <dd className="font-mono text-[0.9375rem] tabular text-ink">
              {formatNumber(stats.coilCount, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-body-s text-muted">
              {t('workspace.archive.meanB')}
            </dt>
            <dd className="font-mono text-[0.9375rem] tabular text-ink">
              {stats.meanBFactor === null
                ? DASH
                : `${new Intl.NumberFormat(locale, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(stats.meanBFactor)} Å²`}
            </dd>
          </div>
          <div>
            <dt className="text-body-s text-muted">
              {t('workspace.archive.hydrophobic')}
            </dt>
            <dd className="font-mono text-[0.9375rem] tabular text-ink">
              {formatPercent(stats.hydrophobicFraction, locale)}
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="archive-ligands">
        <h3
          id="archive-ligands"
          className="mb-3 font-display text-[1.125rem] text-ink"
        >
          {t('workspace.archive.ligands')}
        </h3>
        {meta.ligands.length === 0 ? (
          <EmptyState title={t('workspace.archive.noLigands')} compact />
        ) : (
          <div className="thin-scrollbar overflow-x-auto">
            <table className="w-full min-w-[460px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line font-mono text-mono-s uppercase tracking-[0.06em] text-muted">
                  <th className="py-2 pr-3 font-normal">
                    {t('workspace.archive.ligandId')}
                  </th>
                  <th className="py-2 pr-3 font-normal">
                    {t('workspace.archive.ligandName')}
                  </th>
                  <th className="py-2 pr-3 font-normal">
                    {t('workspace.archive.ligandChain')}
                  </th>
                  <th className="py-2 pr-3 font-normal">
                    {t('workspace.archive.ligandRes')}
                  </th>
                  <th className="py-2 text-right font-normal">
                    {t('workspace.archive.ligandAtoms')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {meta.ligands.map((ligand, position) => (
                  <tr
                    key={`${ligand.chainId}-${ligand.resId}-${ligand.compId}-${position}`}
                    className="border-b border-line/60 text-body-s text-ink"
                  >
                    <td className="py-2 pr-3 font-mono">{ligand.compId}</td>
                    <td className="max-w-[16rem] truncate py-2 pr-3">
                      {ligand.name}
                    </td>
                    <td className="py-2 pr-3 font-mono">{ligand.chainId}</td>
                    <td className="py-2 pr-3 font-mono tabular">
                      {ligand.resId}
                      {ligand.insCode}
                    </td>
                    <td className="py-2 text-right font-mono tabular">
                      {ligand.atomCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="archive-missing">
        <h3
          id="archive-missing"
          className="mb-3 font-display text-[1.125rem] text-ink"
        >
          {t('workspace.archive.missing')}
        </h3>
        {missingGroups.length === 0 ? (
          <EmptyState title={t('workspace.archive.noMissing')} compact />
        ) : (
          <ul className="flex flex-col gap-2">
            {missingGroups.map(([chainId, ranges]) => (
              <li
                key={chainId}
                className="flex items-baseline gap-2 font-mono text-mono-s text-ink"
              >
                <span className="text-muted">
                  {t('common.chain')} {chainId}
                </span>
                <span className="tabular">
                  {ranges
                    .map((range) =>
                      range.start === range.end
                        ? `${range.start}`
                        : `${range.start}–${range.end}`,
                    )
                    .join(', ')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
