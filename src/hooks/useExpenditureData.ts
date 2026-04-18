import { useCallback, useEffect, useMemo, useState } from 'react'
import type { MetricPeriod } from '../components/MetricPeriodDropdown'
import { METRIC_PERIOD_LABEL } from '../components/MetricPeriodDropdown'
import { EXPENDITURE_TYPES, type BalanceSummary, type ExpenditureRow } from '../types/finances'

const NAMES = [
  'Juma Yusuf',
  'Grace Muthoni',
  'Peter Otieno',
  'Wanjiku Njeri',
  'James Kariuki',
  'Amina Hassan',
  'David Ochieng',
  'Lucy Chebet',
  'Samuel Njoroge',
  'Mary Akinyi',
]

function buildMockRows(count: number): ExpenditureRow[] {
  const rows: ExpenditureRow[] = []
  for (let i = 0; i < count; i += 1) {
    const day = 1 + ((i * 3) % 28)
    const month = 1 + ((i * 2) % 12)
    const year = 2026
    const amount = 500 + ((i * 7919 + 101) % 45000)
    const type = EXPENDITURE_TYPES[i % EXPENDITURE_TYPES.length]!
    rows.push({
      id: `exp-${i + 1}`,
      transactionId: `TX${String(1000 + i).padStart(5, '0')}`,
      date: `${day}/${month}/${year}`,
      name: NAMES[i % NAMES.length]!,
      phone: `+254 ${700 + ((i * 13) % 99)} ${100 + ((i * 7) % 900)} ${200 + ((i * 11) % 800)}`,
      type,
      amount,
    })
  }
  return rows
}

/** Placeholder until GET /api/finances/expenditure (or similar) is wired. */
const MOCK_SERVER_ROWS = buildMockRows(30)

const PAGE_SIZE = 8

const DEFAULT_BALANCE: BalanceSummary = {
  totalIncome: 630_450,
  totalExpenses: 160_890,
  netBalance: 469_560,
  statementDateLabel: 'April 20, 2026',
}

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase()
}

export function useExpenditureData() {
  const [rows, setRows] = useState<ExpenditureRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<MetricPeriod>('monthly')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [balanceSummary] = useState<BalanceSummary>(DEFAULT_BALANCE)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        // TODO: replace with real API, e.g. fetch('/api/finances/expenditure?period=' + period)
        await new Promise((r) => setTimeout(r, 200))
        if (cancelled) return
        setRows(MOCK_SERVER_ROWS)
      } catch {
        if (!cancelled) setError('Could not load expenditure data.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [period])

  const periodSubtitle = useMemo(() => {
    const label = METRIC_PERIOD_LABEL[period]
    if (period === 'monthly') return 'Total monthly'
    return `Total ${label.toLowerCase()}`
  }, [period])

  const filteredRows = useMemo(() => {
    const q = normalizeQuery(searchQuery)
    if (!q) return rows
    return rows.filter((r) => {
      const hay = `${r.transactionId} ${r.name} ${r.phone} ${r.date}`.toLowerCase()
      return hay.includes(q)
    })
  }, [rows, searchQuery])

  /** Static trend placeholder (design: down arrow ~12.5%). Replace with API delta when available. */
  const expenditureTrendPct = '12.5%'

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredRows.slice(start, start + PAGE_SIZE)
  }, [filteredRows, page])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, rows.length, period])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const goPrev = useCallback(() => setPage((p) => Math.max(1, p - 1)), [])
  const goNext = useCallback(() => setPage((p) => Math.min(totalPages, p + 1)), [totalPages])

  return {
    loading,
    error,
    period,
    setPeriod,
    periodSubtitle,
    searchQuery,
    setSearchQuery,
    rows: filteredRows,
    paginatedRows,
    page,
    setPage,
    totalPages,
    pageSize: PAGE_SIZE,
    goPrev,
    goNext,
    expenditureTrendPct,
    balanceSummary,
  }
}
