import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/EmptyState'
import { keyOfResidue, keyString } from '@/lib/residue-index'
import { formatResidueId, sameResidue } from '@/lib/format'
import type { ResidueKey, ResidueRecord } from '@/types/api'

interface SequencePanelProps {
  residues: ResidueRecord[]
  selection: ResidueKey | null
  onSelect: (key: ResidueKey) => void
}

type SequenceItem =
  | {
      kind: 'residue'
      residue: ResidueRecord
      key: string
      position: number
    }
  | { kind: 'gap'; start: number; end: number; key: string }

interface ChainGroup {
  chainId: string
  residues: ResidueRecord[]
  items: SequenceItem[]
}

function groupByChain(residues: ResidueRecord[]): ChainGroup[] {
  const groups = new Map<string, ResidueRecord[]>()
  for (const residue of residues) {
    const group = groups.get(residue.chainId)
    if (group) {
      group.push(residue)
    } else {
      groups.set(residue.chainId, [residue])
    }
  }

  return [...groups.entries()].map(([chainId, chainResidues]) => {
    const items: SequenceItem[] = []
    let previous: ResidueRecord | null = null
    let position = 0
    for (const residue of chainResidues) {
      if (
        previous &&
        residue.resId - previous.resId > 1 &&
        residue.insCode === '' &&
        previous.insCode === ''
      ) {
        items.push({
          kind: 'gap',
          start: previous.resId + 1,
          end: residue.resId - 1,
          key: `gap-${chainId}-${previous.resId}-${residue.resId}`,
        })
      }
      items.push({
        kind: 'residue',
        residue,
        key: keyString(keyOfResidue(residue)),
        position,
      })
      position += 1
      previous = residue
    }
    return { chainId, residues: chainResidues, items }
  })
}

export function SequencePanel({
  residues,
  selection,
  onSelect,
}: SequencePanelProps) {
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const groups = useMemo(() => groupByChain(residues), [residues])

  useEffect(() => {
    if (!selection || !scrollRef.current) {
      return
    }
    const target = scrollRef.current.querySelector<HTMLElement>(
      `[data-residue-key="${CSS.escape(keyString(selection))}"]`,
    )
    const scroller = target?.closest<HTMLElement>(
      '[data-sequence-scroller]',
    )
    if (!target || !scroller) {
      return
    }
    // Scroll the sequence strip only; never yank the whole page to the panel.
    const targetRect = target.getBoundingClientRect()
    const scrollerRect = scroller.getBoundingClientRect()
    const delta =
      targetRect.left -
      scrollerRect.left -
      scrollerRect.width / 2 +
      targetRect.width / 2
    scroller.scrollLeft += delta
  }, [selection])

  if (residues.length === 0) {
    return (
      <section aria-labelledby="sequence-title">
        <h3
          id="sequence-title"
          className="mb-3 font-display text-[1.125rem] text-ink"
        >
          {t('sequence.title')}
        </h3>
        <EmptyState title={t('sequence.empty')} compact />
      </section>
    )
  }

  return (
    <section aria-labelledby="sequence-title">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h3
          id="sequence-title"
          className="font-display text-[1.125rem] text-ink"
        >
          {t('sequence.title')}
        </h3>
        <span className="font-mono text-mono-s text-muted">
          {t('sequence.legend')}
        </span>
      </div>

      <div ref={scrollRef} className="flex flex-col gap-4">
        {groups.map((group) => (
          <div key={group.chainId}>
            <div className="mb-1 flex items-baseline justify-between gap-3 font-mono text-mono-s text-muted">
              <span>{t('sequence.chain', { chain: group.chainId })}</span>
              <span>{t('sequence.count', { count: group.residues.length })}</span>
            </div>
            <div
              role="group"
              aria-label={t('a11y.residueList')}
              data-sequence-scroller
              className="thin-scrollbar overflow-x-auto pb-2"
            >
              <div className="flex min-w-max items-end">
                {group.items.map((item) =>
                  item.kind === 'gap' ? (
                    <span
                      key={item.key}
                      title={`${t('sequence.missing')}: ${item.start}–${item.end}`}
                      aria-label={`${t('sequence.missing')}: ${item.start}–${item.end}`}
                      className="mx-0.5 flex h-6 min-w-6 shrink-0 items-center justify-center border-b border-dashed border-line font-mono text-mono-s text-muted"
                    >
                      ···
                    </span>
                  ) : (
                    <ResidueLetter
                      key={item.key}
                      residue={item.residue}
                      positionInChain={item.position}
                      isSelected={sameResidue(
                        keyOfResidue(item.residue),
                        selection,
                      )}
                      onSelect={onSelect}
                    />
                  ),
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

interface ResidueLetterProps {
  residue: ResidueRecord
  positionInChain: number
  isSelected: boolean
  onSelect: (key: ResidueKey) => void
}

function ResidueLetter({
  residue,
  positionInChain,
  isSelected,
  onSelect,
}: ResidueLetterProps) {
  const { t } = useTranslation()
  const label = t('sequence.residueLabel', {
    name3: residue.name3,
    resId: formatResidueId(residue.resId, residue.insCode),
    ins: '',
    chain: residue.chainId,
  })
  const key = keyOfResidue(residue)

  return (
    <div className="flex w-[18px] shrink-0 flex-col items-center">
      <span
        aria-hidden="true"
        className="h-3 font-mono text-[9px] leading-3 text-muted"
      >
        {positionInChain % 10 === 0 ? residue.resId : ''}
      </span>
      <button
        type="button"
        data-residue-key={keyString(key)}
        aria-label={label}
        aria-pressed={isSelected}
        title={label}
        onClick={() => onSelect(key)}
        className={`flex h-6 w-[16px] items-center justify-center border-b-2 font-mono text-[12px] leading-6 transition-colors duration-[180ms] ease-instrument ${
          isSelected
            ? 'border-accent bg-paper text-ink'
            : 'border-transparent text-ink hover:bg-paper'
        }`}
      >
        {residue.name1 ?? '·'}
      </button>
    </div>
  )
}
