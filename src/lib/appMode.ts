/** How the app sources financial / M-Pesa data: mock (demo) vs real APIs (live). */

export type AppMode = 'demo' | 'live'

export const APP_MODE_STORAGE_KEY = 'chama_app_mode'

/** Working balance shown on Transfer Funds pages in demo mode (pre–M-Pesa integration). */
export const DEMO_MOCK_WORKING_BALANCE_KES = 469_560

/** Sentinel disbursement id: review flow completes without calling Daraja poll endpoints. */
export const DEMO_MPESA_TRANSFER_ID = '__chama_demo_transfer__' as const

export function readAppModeFromStorage(): AppMode {
  try {
    const raw = localStorage.getItem(APP_MODE_STORAGE_KEY)
    if (raw === 'live' || raw === 'demo') return raw
  } catch {
    /* ignore */
  }
  return 'demo'
}
