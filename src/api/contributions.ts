import type { MetricPeriod } from '../components/MetricPeriodDropdown'
import { api } from '../lib/api'
import type { ContributionRow } from '../hooks/useContributionsData'

export type ContributionsResponse = {
  period: MetricPeriod
  totalKes: number
  count: number
  rows: ContributionRow[]
}

export async function fetchContributions(
  period: MetricPeriod,
  token: string,
): Promise<ContributionsResponse> {
  const res = await api.get<ContributionsResponse>(`/api/contributions?period=${period}`, token)
  if (!res.success) {
    throw new Error(typeof res.message === 'string' ? res.message : 'Could not load contributions.')
  }
  const rows = Array.isArray(res.rows) ? res.rows : []
  return {
    period: (res.period as MetricPeriod) ?? period,
    totalKes: Number(res.totalKes) || 0,
    count: Number(res.count) || rows.length,
    rows: rows.map((row) => ({
      transactionId: String(row.transactionId ?? ''),
      date: String(row.date ?? ''),
      name: String(row.name ?? ''),
      phone: String(row.phone ?? ''),
      amount: Number(row.amount) || 0,
    })),
  }
}
