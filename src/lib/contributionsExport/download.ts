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
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), BLOB_URL_REVOKE_DELAY_MS)
}

/**
 * WebKit on iPhone/iPad does not treat programmatic `<a download>` clicks as user-initiated once
 * the call stack has crossed an `await` (e.g. PDF generation). Offer a second tap that runs
 * {@link downloadBlob} synchronously in that case.
 */
export function blobDownloadNeedsFollowingUserGesture(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/iP(hone|ad|od)/i.test(ua)) return true
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true
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
