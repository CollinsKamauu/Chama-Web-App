import type { MetricPeriod } from '../components/MetricPeriodDropdown'
import { api } from '../lib/api'
import { normalizeApiRecord, pickArray, pickNumber } from '../lib/api/parseApiFields'

export type DashboardPieSlice = {
  name: string
  value: number
  color: string
}

export type DashboardRecentTransaction = {
  id?: string
  date: string
  name: string
  category: string
  amount: number | string
}

export type DashboardSummary = {
  contributionsTotalKes: number
  contributionsTrendPercent: number
  expenditureTotalKes: number
  expenditureTrendPercent: number
  balanceTotalKes: number
  balanceTrendPercent: number
  pieSlices: DashboardPieSlice[]
  recentTransactions: DashboardRecentTransaction[]
}

function mapDashboardSummary(res: Record<string, unknown>): DashboardSummary {
  const body = normalizeApiRecord(res)
  return {
    contributionsTotalKes: pickNumber(
      body,
      'contributionsTotalKes',
      'contributions_total_kes',
      'totalContributionsKes',
    ),
    contributionsTrendPercent: pickNumber(
      body,
      'contributionsTrendPercent',
      'contributions_trend_percent',
    ),
    expenditureTotalKes: pickNumber(
      body,
      'expenditureTotalKes',
      'expenditure_total_kes',
      'totalExpenditureKes',
    ),
    expenditureTrendPercent: pickNumber(
      body,
      'expenditureTrendPercent',
      'expenditure_trend_percent',
    ),
    balanceTotalKes: pickNumber(
      body,
      'balanceTotalKes',
      'balance_total_kes',
      'balanceKes',
      'netBalanceKes',
    ),
    balanceTrendPercent: pickNumber(body, 'balanceTrendPercent', 'balance_trend_percent'),
    pieSlices: pickArray<DashboardPieSlice>(body, 'pieSlices', 'pie_slices'),
    recentTransactions: pickArray<DashboardRecentTransaction>(
      body,
      'recentTransactions',
      'recent_transactions',
    ),
  }
}

export async function fetchDashboardSummary(
  period: MetricPeriod,
  token: string,
): Promise<DashboardSummary> {
  const res = await api.get<DashboardSummary>(`/api/dashboard/summary?period=${period}`, token)
  if (!res.success) {
    throw new Error(typeof res.message === 'string' ? res.message : 'Could not load dashboard.')
  }
  return mapDashboardSummary(res as Record<string, unknown>)
}
