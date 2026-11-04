import { Search } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/Button'
import { ApiError, fetchEntry } from '@/lib/api'
import { primeEntryCache } from '@/lib/use-entry'

const PDB_ID_PATTERN = /^[A-Za-z0-9]{4}$/
const CHIPS = ['1CRN', '4HHB', '6M0J'] as const

function errorKeyFor(error: ApiError): string {
  if (error.code === 'ENTRY_NOT_FOUND') {
    return 'home.search.errorNotFound'
  }
  if (error.code === 'NETWORK') {
    return 'home.search.errorNetwork'
  }
  if (error.code === 'UPSTREAM_TIMEOUT') {
    return 'home.search.errorTimeout'
  }
  return 'home.search.errorGeneric'
}

export function SearchForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)

  const openEntry = async (raw: string) => {
    const entryId = raw.trim().replaceAll(/\s+/g, '').toUpperCase()
    if (!PDB_ID_PATTERN.test(entryId)) {
      setErrorKey('home.search.invalid')
      return
    }
    setErrorKey(null)
    setIsLoading(true)
    try {
      const analysis = await fetchEntry(entryId)
      primeEntryCache(entryId, analysis)
      navigate(`/entry/${entryId}?scheme=ss`)
    } catch (error) {
      setErrorKey(
        errorKeyFor(
          error instanceof ApiError
            ? error
            : new ApiError('UNKNOWN', 0, '', null),
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void openEntry(value)
  }

  const handleChip = (pdbId: string) => {
    setValue(pdbId)
    void openEntry(pdbId)
  }

  return (
    <div className="w-full max-w-[560px]">
      <form onSubmit={handleSubmit} noValidate>
        <label
          htmlFor="pdb-search"
          className="mb-2 block font-mono text-mono-s uppercase tracking-[0.08em] text-muted"
        >
          {t('home.search.label')}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            />
            <input
              id="pdb-search"
              name="pdb"
              type="text"
              value={value}
              onChange={(event) => {
                setValue(event.target.value)
                if (errorKey) {
                  setErrorKey(null)
                }
              }}
              placeholder={t('home.search.placeholder')}
              aria-invalid={errorKey ? true : undefined}
              aria-describedby={errorKey ? 'pdb-search-error' : 'pdb-search-hint'}
              autoComplete="off"
              spellCheck={false}
              maxLength={8}
              disabled={isLoading}
              className="h-12 w-full rounded-sm border border-line bg-surface pl-10 pr-4 font-mono text-mono uppercase tracking-[0.04em] text-ink placeholder:font-body placeholder:normal-case placeholder:tracking-normal placeholder:text-muted/70 focus:border-accent focus:outline-hidden disabled:opacity-60"
            />
            <span
              id="pdb-search-hint"
              className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 font-mono text-mono-s text-muted sm:block"
            >
              {t('home.search.hint')}
            </span>
          </div>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? t('home.search.opening') : t('home.search.submit')}
          </Button>
        </div>
        {errorKey ? (
          <p
            id="pdb-search-error"
            role="alert"
            className="mt-2 text-body-s text-danger"
          >
            {t(errorKey)}
          </p>
        ) : null}
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="font-mono text-mono-s uppercase tracking-[0.08em] text-muted">
          {t('home.chips.label')}
        </span>
        {CHIPS.map((pdbId) => (
          <button
            key={pdbId}
            type="button"
            onClick={() => handleChip(pdbId)}
            disabled={isLoading}
            className="rounded-xs border border-line bg-surface px-2 py-1 font-mono text-mono-s text-ink transition-colors duration-[180ms] ease-instrument hover:border-ink disabled:opacity-50"
          >
            {pdbId}
          </button>
        ))}
      </div>
    </div>
  )
}
