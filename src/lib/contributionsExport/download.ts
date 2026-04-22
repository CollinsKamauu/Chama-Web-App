/**
 * iOS Safari / some mobile engines start the file transfer asynchronously; revoking the blob URL
 * immediately after a synthetic click can cancel the download before it begins.
 */
const BLOB_URL_REVOKE_DELAY_MS = 90_000

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener noreferrer'
  // Avoid `display: none` — some Chromium mobile builds ignore synthetic clicks on fully hidden links.
  a.setAttribute(
    'style',
    'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0.01;pointer-events:none;overflow:hidden;',
  )
  document.body.appendChild(a)
  a.click()
  requestAnimationFrame(() => {
    a.remove()
  })
  window.setTimeout(() => URL.revokeObjectURL(url), BLOB_URL_REVOKE_DELAY_MS)
}

/**
 * After a blob is built asynchronously (e.g. jsPDF), mobile browsers often reject a synthetic
 * `<a download>` click. Run this from a **direct** tap handler: prefers the Web Share API with a
 * `File` (works well on Android Chrome), then falls back to {@link downloadBlob}.
 */
export function savePreparedBlobAsFile(blob: Blob, filename: string): void {
  const mime = blob.type || 'application/pdf'
  const file = new File([blob], filename, { type: mime })

  if (typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
    try {
      if (navigator.canShare({ files: [file] })) {
        void navigator.share({ files: [file] }).catch((err: unknown) => {
          const name =
            typeof err === 'object' && err !== null && 'name' in err ? String((err as { name: string }).name) : ''
          if (name === 'AbortError') return
          downloadBlob(blob, filename)
        })
        return
      }
    } catch {
      /* canShare threw — fall through */
    }
  }

  downloadBlob(blob, filename)
}

/**
 * True when the first tap should only **build** the blob; a second tap must call
 * {@link savePreparedBlobAsFile} / {@link downloadBlob} on a fresh user gesture.
 * (iOS WebKit, Android Chrome, and other touch-primary UAs.)
 */
export function blobDownloadNeedsFollowingUserGesture(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/iP(hone|ad|od)/i.test(ua)) return true
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true
  if (/Android/i.test(ua)) return true
  if (typeof window !== 'undefined' && window.matchMedia?.('(hover: none) and (pointer: coarse)').matches) {
    return true
  }
  return false
}

export function formatExportStamp(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatExportDateLong(d: Date): string {
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
