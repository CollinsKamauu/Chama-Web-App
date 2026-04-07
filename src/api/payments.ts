import { getApiBaseUrl } from './auth'

// ─── Type ──────────────────────────────────────────────────────────────────────

export type Transaction = {
  id: string
  transId: string
  transAmount: number
  msisdn: string
  billRefNumber: string
  transTime: string   // raw Safaricom format: "20260325140000"
  firstName: string
  lastName: string
  businessShortCode: string
  transType: string   // "C2B" | "STKPush"
  createdAt: string   // ISO date string
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Formats a Safaricom TransTime string ("20260325140000") into a readable date.
 * Returns e.g. "25/3/2026"
 */
export function formatTransTime(transTime: string): string {
  if (!transTime || transTime.length < 8) return transTime
  const year = transTime.slice(0, 4)
  const month = transTime.slice(4, 6)
  const day = transTime.slice(6, 8)
  return `${parseInt(day)}/${parseInt(month)}/${year}`
}

/**
 * Formats a phone number from "254712345678" to "+254 712 345 678"
 */
export function formatPhone(msisdn: string): string {
  const digits = String(msisdn).replace(/\D/g, '')
  if (digits.startsWith('254') && digits.length === 12) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`
  }
  return msisdn
}

/**
 * Formats an amount number to a locale string e.g. 1000 → "1,000"
 */
export function formatAmount(amount: number): string {
  return amount.toLocaleString('en-KE')
}

// ─── Table row (matches HomePage PaymentRow) ─────────────────────────────────

export type PaymentTableRow = {
  id: string
  date: string
  name: string
  phone: string
  amount: string
}

export function transactionToPaymentRow(t: Transaction): PaymentTableRow {
  const first = (t.firstName ?? '').trim()
  const last = (t.lastName ?? '').trim()
  const name = [first, last].filter(Boolean).join(' ') || 'Member'
  return {
    id: t.transId,
    date: formatTransTime(t.transTime),
    name,
    phone: formatPhone(t.msisdn),
    amount: formatAmount(t.transAmount),
  }
}

// ─── API Call ──────────────────────────────────────────────────────────────────

/**
 * Fetches M-Pesa Transaction rows from Milestone-Chama-Backend.
 * Requires a valid auth token (Bearer).
 *
 * Backend: GET /api/transactions → { success: true, data: Transaction[] }
 * @see https://github.com/K3-is-M3/Milestone-Chama-Backend
 */
export async function fetchTransactions(token: string): Promise<Transaction[]> {
  const path = '/api/transactions'
  const url = import.meta.env.DEV ? path : `${getApiBaseUrl()}${path}`

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch transactions (${res.status})`)
  }

  const json = (await res.json()) as { success: boolean; data?: Transaction[] }

  if (!json.success || !Array.isArray(json.data)) {
    throw new Error('Unexpected response shape from /api/transactions')
  }

  return json.data
}
