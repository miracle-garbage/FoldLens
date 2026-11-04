import { Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { ApiError, uploadStructure } from '@/lib/api'
import { primeEntryCache } from '@/lib/use-entry'

const MAX_BYTES = 50 * 1024 * 1024
const ALLOWED_SUFFIXES = ['.cif', '.mmcif', '.pdb']

type UploadErrorKey =
  | 'home.upload.invalid'
  | 'home.upload.tooLarge'
  | 'home.upload.failed'

function suffixOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot).toLowerCase()
}

export function UploadStructure() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorKey, setErrorKey] = useState<UploadErrorKey | null>(null)

  const handleFile = async (file: File) => {
    if (!ALLOWED_SUFFIXES.includes(suffixOf(file.name))) {
      setErrorKey('home.upload.invalid')
      return
    }
    if (file.size > MAX_BYTES) {
      setErrorKey('home.upload.tooLarge')
      return
    }
    setErrorKey(null)
    setIsLoading(true)
    try {
      const result = await uploadStructure(file)
      primeEntryCache(result.entryId, result.analysis)
      navigate(`/entry/${result.entryId}?scheme=ss`)
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.code === 'FILE_TOO_LARGE' || error.code === 'UNSUPPORTED_FORMAT')
      ) {
        setErrorKey(
          error.code === 'FILE_TOO_LARGE'
            ? 'home.upload.tooLarge'
            : 'home.upload.invalid',
        )
      } else {
        setErrorKey('home.upload.failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-6">
      <input
        ref={inputRef}
        type="file"
        accept=".cif,.mmcif,.pdb"
        className="sr-only"
        aria-label={t('home.upload.button')}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) {
            void handleFile(file)
          }
        }}
      />
      <button
        type="button"
        disabled={isLoading}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 text-body-s text-ink underline decoration-line underline-offset-4 transition-colors duration-[180ms] ease-instrument hover:decoration-accent-ink disabled:opacity-50"
      >
        <Upload aria-hidden="true" className="size-4" />
        {isLoading ? t('home.upload.opening') : t('home.upload.button')}
      </button>
      <p className="mt-1.5 text-body-s text-muted">{t('home.upload.hint')}</p>
      {errorKey ? (
        <p role="alert" className="mt-2 text-body-s text-danger">
          {t(errorKey)}
        </p>
      ) : null}
    </div>
  )
}
