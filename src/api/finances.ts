import type { MetricPeriod } from '../components/MetricPeriodDropdown'
import { api } from '../lib/api'
import { normalizeApiRecord, pickArray, pickNumber } from '../lib/api/parseApiFields'
import { EXPENDITURE_TYPES, type BalanceSummary, type ExpenditureRow, type ExpenditureType } from '../types/finances'

export type ExpenditureApiRow = {
  id: string
  date: string
  amount: number
  category: string
  description: string
  recordedBy: string
}

export type ExpenditureResponse = {
  period: MetricPeriod
  totalKes: number
  count: number
  rows: ExpenditureApiRow[]
}

export type BalanceSummaryResponse = {
  totalInKes: number
  totalOutKes: number
  balanceKes: number
  periodInKes: number
  periodOutKes: number
  inTrendPercent: number
  outTrendPercent: number
  balanceTrendPercent: number
}

function toExpenditureType(category: string): ExpenditureType {
  const normalized = category.trim().toLowerCase()
  const match = EXPENDITURE_TYPES.find((t) => t.toLowerCase() === normalized)
  if (match) return match
  if (normalized === 'admin' || normalized === 'bill') return 'Bill'
  if (normalized === 'event') return 'Event'
  if (normalized === 'service provider') return 'Service Provider'
  return 'Miscellaneous'
}

export function mapExpenditureApiRow(row: ExpenditureApiRow): ExpenditureRow {
  return {
    id: row.id,
    transactionId: row.description || row.id,
    date: row.date,
    name: row.recordedBy || '—',
    phone: '',
    type: toExpenditureType(row.category),
    amount: Number(row.amount) || 0,
  }
}

function mapBalanceSummaryResponse(res: Record<string, unknown>): BalanceSummaryResponse {
  const body = normalizeApiRecord(res)
  return {
    totalInKes: pickNumber(body, 'totalInKes', 'total_in_kes', 'totalIncomeKes'),
    totalOutKes: pickNumber(body, 'totalOutKes', 'total_out_kes', 'totalExpensesKes'),
    balanceKes: pickNumber(body, 'balanceKes', 'balance_kes', 'netBalanceKes', 'balanceTotalKes'),
    periodInKes: pickNumber(body, 'periodInKes', 'period_in_kes'),
    periodOutKes: pickNumber(body, 'periodOutKes', 'period_out_kes'),
    inTrendPercent: pickNumber(body, 'inTrendPercent', 'in_trend_percent'),
    outTrendPercent: pickNumber(body, 'outTrendPercent', 'out_trend_percent'),
    balanceTrendPercent: pickNumber(body, 'balanceTrendPercent', 'balance_trend_percent'),
  }
}

export function mapBalanceSummaryToUi(
  res: BalanceSummaryResponse,
  statementDateLabel: string,
): BalanceSummary {
  return {
    totalIncome: res.totalInKes,
    totalExpenses: res.totalOutKes,
    netBalance: res.balanceKes,
    statementDateLabel,
  }
}

export async function fetchExpenditure(
  period: MetricPeriod,
  token: string,
): Promise<{ rows: ExpenditureRow[]; totalKes: number; trendPercent: number }> {
  const res = await api.get<ExpenditureResponse>(`/api/finances/expenditure?period=${period}`, token)
  if (!res.success) {
    throw new Error(typeof res.message === 'string' ? res.message : 'Could not load expenditure.')
  }
  const body = normalizeApiRecord(res as Record<string, unknown>)
  const apiRows = pickArray<ExpenditureApiRow>(body, 'rows')
  return {
    rows: apiRows.map(mapExpenditureApiRow),
    totalKes: pickNumber(body, 'totalKes', 'total_kes'),
    trendPercent: 0,
  }
}

export async function fetchBalanceSummary(
  period: MetricPeriod,
  token: string,
): Promise<BalanceSummaryResponse> {
  const res = await api.get<BalanceSummaryResponse>(
    `/api/finances/balance-summary?period=${period}`,
    token,
  )
  if (!res.success) {
    throw new Error(typeof res.message === 'string' ? res.message : 'Could not load balance summary.')
  }
  return mapBalanceSummaryResponse(res as Record<string, unknown>)
}

/** Fund balance card always uses all-time totals from the backend. */
export async function fetchFundBalance(token: string): Promise<BalanceSummaryResponse> {
  return fetchBalanceSummary('allTime', token)
}

export type MpesaBalanceResponse = {
  balanceKes: number | null
  stale: boolean
  updatedAt?: string
  hint?: string | null
}

export async function fetchMpesaBalance(token: string): Promise<MpesaBalanceResponse> {
  const res = await api.get<Record<string, unknown>>('/api/mpesa/balance', token)
  if (!res.success) {
    throw new Error(typeof res.message === 'string' ? res.message : 'Could not load M-Pesa balance.')
  }
  const body = normalizeApiRecord(res as Record<string, unknown>)
  const raw = pickNumber(body, 'balanceKes', 'balance_kes', 'workingBalanceKes', 'availableBalance')
  return {
    balanceKes: Number.isFinite(raw) ? raw : null,
    stale: Boolean(body.stale),
    updatedAt: typeof body.updatedAt === 'string' ? body.updatedAt : undefined,
    hint: typeof body.hint === 'string' ? body.hint : null,
  }
}
