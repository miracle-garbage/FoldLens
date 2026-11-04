import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ArchivePanel } from '@/features/analysis/ArchivePanel'
import { ContactMap } from '@/features/analysis/ContactMap'
import { RamachandranPlot } from '@/features/analysis/RamachandranPlot'
import { ResidueCard } from '@/features/analysis/ResidueCard'
import { SequencePanel } from '@/features/sequence/SequencePanel'
import type { ResidueIndex } from '@/lib/residue-index'
import type {
  EntryAnalysis,
  ResidueKey,
} from '@/types/api'

type Tab = 'analysis' | 'archive'

interface SidePanelProps {
  analysis: EntryAnalysis
  index: ResidueIndex
  selection: ResidueKey | null
  onSelect: (key: ResidueKey) => void
}

export function SidePanel({
  analysis,
  index,
  selection,
  onSelect,
}: SidePanelProps) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('analysis')

  const tabs: { value: Tab; label: string }[] = [
    { value: 'analysis', label: t('workspace.tabs.analysis') },
    { value: 'archive', label: t('workspace.tabs.archive') },
  ]

  const handleTabKey = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return
    }
    event.preventDefault()
    setTab(tab === 'analysis' ? 'archive' : 'analysis')
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-line bg-surface">
      <ResidueCard
        analysis={analysis}
        index={index}
        selection={selection}
        onSelect={onSelect}
      />

      <div
        role="tablist"
        aria-label={t('workspace.tabs.analysis')}
        className="flex shrink-0 gap-4 border-b border-line px-5"
      >
        {tabs.map((entry) => (
          <button
            key={entry.value}
            type="button"
            role="tab"
            id={`tab-${entry.value}`}
            aria-selected={tab === entry.value}
            aria-controls={`panel-${entry.value}`}
            tabIndex={tab === entry.value ? 0 : -1}
            onClick={() => setTab(entry.value)}
            onKeyDown={handleTabKey}
            className={`-mb-px border-b-2 py-2.5 text-body-s transition-colors duration-[180ms] ease-instrument ${
              tab === entry.value
                ? 'border-ink text-ink'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="thin-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5"
      >
        {tab === 'analysis' ? (
          <div className="flex flex-col gap-8 animate-panel-in">
            <SequencePanel
              residues={analysis.residues}
              selection={selection}
              onSelect={onSelect}
            />
            <RamachandranPlot
              residues={analysis.residues}
              selection={selection}
              onSelect={onSelect}
            />
            <ContactMap
              residues={analysis.residues}
              contacts={analysis.contacts}
              selection={selection}
              onSelect={onSelect}
            />
          </div>
        ) : (
          <div className="animate-panel-in">
            <ArchivePanel analysis={analysis} />
          </div>
        )}
      </div>
    </div>
  )
}
