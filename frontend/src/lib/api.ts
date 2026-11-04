/** All HTTP access lives here; components never call `fetch` directly. */

import type {
  ApiErrorBody,
  EntryAnalysis,
  SampleSummary,
  UploadResponse,
} from '@/types/api'

const API_BASE = '/api'

export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly detail: unknown

  constructor(code: string, status: number, message: string, detail: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.detail = detail
  }
}

function toApiError(status: number, payload: unknown): ApiError {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'error' in payload &&
    typeof (payload as ApiErrorBody).error === 'object'
  ) {
    const body = (payload as ApiErrorBody).error
    return new ApiError(
      body.code,
      status,
      body.message,
      body.detail ?? null,
    )
  }
  return new ApiError('INTERNAL_ERROR', status, 'Unexpected response.', null)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, init)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new ApiError('NETWORK', 0, 'Could not reach the local service.', null)
  }
  if (!response.ok) {
    let payload: unknown = null
    try {
      payload = await response.json()
    } catch {
      // Keep `null`: the response body was not JSON.
    }
    throw toApiError(response.status, payload)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

export function fetchSamples(signal?: AbortSignal): Promise<SampleSummary[]> {
  return request<SampleSummary[]>('/samples', { signal })
}

export function fetchEntry(
  entryId: string,
  signal?: AbortSignal,
  refresh = false,
): Promise<EntryAnalysis> {
  const suffix = refresh ? '?refresh=true' : ''
  return request<EntryAnalysis>(
    `/entries/${encodeURIComponent(entryId)}${suffix}`,
    { signal },
  )
}

export async function fetchStructureText(
  entryId: string,
  signal?: AbortSignal,
): Promise<string> {
  let response: Response
  try {
    response = await fetch(
      `${API_BASE}/entries/${encodeURIComponent(entryId)}/structure`,
      { signal },
    )
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new ApiError('NETWORK', 0, 'Could not reach the local service.', null)
  }
  if (!response.ok) {
    let payload: unknown = null
    try {
      payload = await response.json()
    } catch {
      // Keep `null`: the response body was not JSON.
    }
    throw toApiError(response.status, payload)
  }
  return response.text()
}

export function uploadStructure(file: File): Promise<UploadResponse> {
  const body = new FormData()
  body.append('file', file)
  return request<UploadResponse>('/uploads', { method: 'POST', body })
}

export function thumbnailUrl(pdbId: string): string {
  return `${API_BASE}/thumbnails/${encodeURIComponent(pdbId.toLowerCase())}`
}
