import { useEffect, useMemo, useState } from 'react'
import { fetchDashboardSummary, type DashboardSummary } from '../api/dashboard'
import type { MetricPeriod } from '../components/MetricPeriodDropdown'
import { useAppMode } from './useAppMode'
import { useEffectiveToken } from './useEffectiveToken'

export type DashboardTransactionRow = {
  id: string
  date: string
  name: string
  category: string
  amount: string
  colorClass: 'orange' | 'blue' | 'green' | 'yellow' | 'gray'
}

export type DashboardBalanceSlice = {
  name: string
  value: number
  color: string
}

const DEMO_BALANCE_SLICES: DashboardBalanceSlice[] = [
  { name: 'Contributions', value: 630450, color: '#1f73dc' },
  { name: 'Expenditure', value: 160890, color: '#ff9348' },
]

const DEMO_CONTRIBUTIONS = { total: 630_450, trend: 15.8 }
const DEMO_EXPENDITURE = { total: 160_890, trend: -12.5 }
const DEMO_BALANCE = { total: 469_560, trend: 15.8 }

const EMPTY_CONTRIBUTIONS = { total: 0, trend: 0 }
const EMPTY_EXPENDITURE = { total: 0, trend: 0 }
const EMPTY_BALANCE = { total: 0, trend: 0 }

const MOCK_TX_NAMES = [
  'Grace Muthoni',
  'Peter Otieno',
  'Wanjiku Njeri',
  'James Kariuki',
  'Amina Hassan',
  'David Ochieng',
  'Lucy Chebet',
  'Samuel Njoroge',
  'Mary Akinyi',
  'Tom Mwenda',
]

const MOCK_TX_AMOUNTS = [450, 1200, 1675, 2100, 3200, 4999, 5050, 7500, 8900, 9999]

const CATEGORY_COLOR: Record<string, DashboardTransactionRow['colorClass']> = {
  'service provider': 'orange',
  benevolent: 'blue',
  disbursement: 'green',
  event: 'yellow',
  miscellaneous: 'gray',
  contribution: 'blue',
  bill: 'gray',
  admin: 'gray',
}

function categoryColorClass(category: string): DashboardTransactionRow['colorClass'] {
  return CATEGORY_COLOR[category.trim().toLowerCase()] ?? 'gray'
}

export function formatTrendPct(value: number): string {
  return `${Math.abs(value).toFixed(1)}%`
}

function buildDemoTransactions(): DashboardTransactionRow[] {
  const categories = ['Contribution', 'Event', 'Disbursement', 'Benevolent', 'Service provider']
  return MOCK_TX_AMOUNTS.map((rawAmount, i) => ({
    id: `tx-${i + 1}`,
    date: `${28 - ((i * 5) % 26)}/${2 + ((i * 3) % 2)}/2026`,
    name: MOCK_TX_NAMES[(i * 11 + 4) % MOCK_TX_NAMES.length],
    category: categories[(i * 7) % categories.length],
    colorClass: categoryColorClass(categories[(i * 7) % categories.length]),
    amount: rawAmount.toLocaleString('en-US'),
  }))
}

function mapSummaryTransactions(
  rows: DashboardSummary['recentTransactions'],
): DashboardTransactionRow[] {
  return rows.map((row, i) => {
    const amountNum = typeof row.amount === 'number' ? row.amount : Number(row.amount) || 0
    const category = String(row.category ?? 'Miscellaneous')
    return {
      id: String(row.id ?? `tx-${i + 1}`),
      date: String(row.date ?? ''),
      name: String(row.name ?? 'Member'),
      category,
      colorClass: categoryColorClass(category),
      amount: amountNum.toLocaleString('en-US'),
    }
  })
}

export function useDashboardData(
  contributionPeriod: MetricPeriod,
  expenditurePeriod: MetricPeriod,
  transactionsPeriod: MetricPeriod,
) {
  const token = useEffectiveToken()
  const { mode } = useAppMode()
  const [contributionSummary, setContributionSummary] = useState(DEMO_CONTRIBUTIONS)
  const [expenditureSummary, setExpenditureSummary] = useState(DEMO_EXPENDITURE)
  const [balanceSummary, setBalanceSummary] = useState(DEMO_BALANCE)
  const [balanceSlices, setBalanceSlices] = useState(DEMO_BALANCE_SLICES)
  const [transactions, setTransactions] = useState<DashboardTransactionRow[]>(() => buildDemoTransactions())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (mode === 'demo') {
      setContributionSummary(DEMO_CONTRIBUTIONS)
      setExpenditureSummary(DEMO_EXPENDITURE)
      setBalanceSummary(DEMO_BALANCE)
      setBalanceSlices(DEMO_BALANCE_SLICES)
      setTransactions(buildDemoTransactions())
      setError(null)
      setLoading(false)
      return
    }

    if (!token) {
      setContributionSummary(EMPTY_CONTRIBUTIONS)
      setExpenditureSummary(EMPTY_EXPENDITURE)
      setBalanceSummary(EMPTY_BALANCE)
      setBalanceSlices([])
      setTransactions([])
      setError('Sign in to load live dashboard data.')
      setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      setContributionSummary(EMPTY_CONTRIBUTIONS)
      setExpenditureSummary(EMPTY_EXPENDITURE)
      setBalanceSummary(EMPTY_BALANCE)
      setBalanceSlices([])
      setTransactions([])
      try {
        const [contrib, expend, fundBalance, activity] = await Promise.all([
          fetchDashboardSummary(contributionPeriod, token),
          fetchDashboardSummary(expenditurePeriod, token),
          fetchDashboardSummary('allTime', token),
          fetchDashboardSummary(transactionsPeriod, token),
        ])
        if (cancelled) return
        setContributionSummary({
          total: contrib.contributionsTotalKes,
          trend: contrib.contributionsTrendPercent,
        })
        setExpenditureSummary({
          total: expend.expenditureTotalKes,
          trend: expend.expenditureTrendPercent,
        })
        setBalanceSummary({
          total: fundBalance.balanceTotalKes,
          trend: fundBalance.balanceTrendPercent,
        })
        setBalanceSlices(
          fundBalance.pieSlices.length >= 2
            ? fundBalance.pieSlices
            : [
                {
                  name: 'Contributions',
                  value: fundBalance.contributionsTotalKes,
                  color: '#1f73dc',
                },
                {
                  name: 'Expenditure',
                  value: fundBalance.expenditureTotalKes,
                  color: '#ff9348',
                },
              ],
        )
        setTransactions(mapSummaryTransactions(activity.recentTransactions))
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load dashboard.')
          setContributionSummary(EMPTY_CONTRIBUTIONS)
          setExpenditureSummary(EMPTY_EXPENDITURE)
          setBalanceSummary(EMPTY_BALANCE)
          setBalanceSlices([])
          setTransactions([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [mode, token, contributionPeriod, expenditurePeriod, transactionsPeriod])

  const balanceAmountLabel = useMemo(
    () => `KES ${balanceSummary.total.toLocaleString('en-US')}`,
    [balanceSummary.total],
  )

  return {
    loading,
    error,
    contributionSummary,
    expenditureSummary,
    balanceSummary,
    balanceSlices,
    transactions,
    balanceAmountLabel,
  }
}
