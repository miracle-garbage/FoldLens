import { useCallback, useEffect, useState } from 'react'

import { ApiError, fetchEntry, fetchSamples, fetchStructureText } from '@/lib/api'
import type { EntryAnalysis, SampleSummary } from '@/types/api'
import type { AsyncState } from '@/types/domain'

const entryCache = new Map<string, EntryAnalysis>()
const structureCache = new Map<string, string>()
let samplesCache: SampleSummary[] | null = null

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error
  }
  return new ApiError('UNKNOWN', 0, 'Unexpected error.', null)
}

/** Seed the in-session cache after a successful preflight (home search/upload). */
export function primeEntryCache(entryId: string, analysis: EntryAnalysis): void {
  entryCache.set(entryId, analysis)
}

/** Clear all in-memory caches (used when retrying from an error state). */
export function clearEntryCache(entryId: string): void {
  entryCache.delete(entryId)
}

interface AsyncResource<T> {
  state: AsyncState<T>
  retry: () => void
}

function initialEntryState(
  entryId: string | null,
): AsyncState<EntryAnalysis> {
  if (!entryId) {
    return { status: 'idle' }
  }
  const cached = entryCache.get(entryId)
  return cached
    ? { status: 'success', data: cached }
    : { status: 'loading' }
}

/**
 * Fetch one entry with an in-session cache.
 *
 * Callers mount this hook with a stable `key` per entry, so the state
 * initialiser can read the preflight cache without setting state in an effect.
 */
export function useEntry(entryId: string): AsyncResource<EntryAnalysis> {
  const [state, setState] = useState<AsyncState<EntryAnalysis>>(() =>
    initialEntryState(entryId),
  )
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (entryCache.has(entryId)) {
      return
    }
    const controller = new AbortController()
    fetchEntry(entryId, controller.signal)
      .then((data) => {
        entryCache.set(entryId, data)
        setState({ status: 'success', data })
      })
      .catch((error: unknown) => {
        if (isAbort(error)) {
          return
        }
        setState({ status: 'error', error: normalizeError(error) })
      })
    return () => controller.abort()
  }, [entryId, attempt])

  const retry = useCallback(() => {
    clearEntryCache(entryId)
    setState({ status: 'loading' })
    setAttempt((value) => value + 1)
  }, [entryId])

  return { state, retry }
}

function initialStructureState(
  entryId: string | null,
): AsyncState<string> {
  if (!entryId) {
    return { status: 'idle' }
  }
  const cached = structureCache.get(entryId)
  return cached
    ? { status: 'success', data: cached }
    : { status: 'loading' }
}

export function useStructureText(
  entryId: string,
): AsyncResource<string> {
  const [state, setState] = useState<AsyncState<string>>(() =>
    initialStructureState(entryId),
  )
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (structureCache.has(entryId)) {
      return
    }
    const controller = new AbortController()
    fetchStructureText(entryId, controller.signal)
      .then((text) => {
        structureCache.set(entryId, text)
        setState({ status: 'success', data: text })
      })
      .catch((error: unknown) => {
        if (isAbort(error)) {
          return
        }
        setState({ status: 'error', error: normalizeError(error) })
      })
    return () => controller.abort()
  }, [entryId, attempt])

  const retry = useCallback(() => {
    structureCache.delete(entryId)
    setState({ status: 'loading' })
    setAttempt((value) => value + 1)
  }, [entryId])

  return { state, retry }
}

export function useSamples(): AsyncResource<SampleSummary[]> {
  const [state, setState] = useState<AsyncState<SampleSummary[]>>(() =>
    samplesCache
      ? { status: 'success', data: samplesCache }
      : { status: 'loading' },
  )
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (samplesCache) {
      return
    }
    const controller = new AbortController()
    fetchSamples(controller.signal)
      .then((data) => {
        samplesCache = data
        setState({ status: 'success', data })
      })
      .catch((error: unknown) => {
        if (isAbort(error)) {
          return
        }
        setState({ status: 'error', error: normalizeError(error) })
      })
    return () => controller.abort()
  }, [attempt])

  const retry = useCallback(() => {
    samplesCache = null
    setState({ status: 'loading' })
    setAttempt((value) => value + 1)
  }, [])

  return { state, retry }
}
