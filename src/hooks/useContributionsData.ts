import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchContributions } from '../api/contributions'
import type { MetricPeriod } from '../components/MetricPeriodDropdown'
import { METRIC_PERIOD_LABEL } from '../components/MetricPeriodDropdown'
import { useAuth } from '../context/AuthContext'
import { useAppMode } from './useAppMode'

export type ContributionRow = {
  transactionId: string
  date: string
  name: string
  phone: string
  amount: number
}

const NAMES = [
  'Juma Yusuf',
  'Michael Mathu',
  'Mary Wambui',
  'Peter Otieno',
  'Grace Muthoni',
  'Wanjiku Njeri',
  'James Kariuki',
  'Amina Hassan',
  'David Ochieng',
  'Lucy Chebet',
  'Samuel Njoroge',
  'Brian Mutua',
  'Esther Adhiambo',
  'Kevin Kamau',
  'Ruth Wambui',
]

const TX_CHARS = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function parseContributionDateDMY(s: string): Date | null {
  const parts = s.split('/')
  if (parts.length !== 3) return null
  const day = Number.parseInt(parts[0], 10)
  const month = Number.parseInt(parts[1], 10) - 1
  const year = Number.parseInt(parts[2], 10)
  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) return null
  return startOfDay(new Date(year, month, day))
}

function formatDMY(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

function addDays(d: Date, delta: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + delta)
  return startOfDay(x)
}

function rowInPeriod(rowDate: Date, period: MetricPeriod, anchor: Date): boolean {
  if (period === 'allTime') return true
  const a = startOfDay(anchor)
  const r = startOfDay(rowDate)
  if (period === 'today') return r.getTime() === a.getTime()
  if (period === 'last7') {
    const end = a
    const start = addDays(a, -6)
    return r.getTime() >= start.getTime() && r.getTime() <= end.getTime()
  }
  return r.getFullYear() === a.getFullYear() && r.getMonth() === a.getMonth()
}

function sumAmountsForPeriod(rows: ContributionRow[], period: MetricPeriod, anchor: Date): number {
  return rows.reduce((sum, row) => {
    const rd = parseContributionDateDMY(row.date)
    if (!rd) return sum
    return sum + (rowInPeriod(rd, period, anchor) ? row.amount : 0)
  }, 0)
}

function filterRowsByPeriod(rows: ContributionRow[], period: MetricPeriod, anchor: Date): ContributionRow[] {
  return rows.filter((row) => {
    const rd = parseContributionDateDMY(row.date)
    if (!rd) return false
    return rowInPeriod(rd, period, anchor)
  })
}

function deterministicTxSuffix(i: number): string {
  return Array.from({ length: 6 }, (_, k) => TX_CHARS[(i * 17 + k * 31) % TX_CHARS.length]).join('')
}

function deterministicPhone(i: number): string {
  const a = 700 + ((i * 13) % 100)
  const b = 100 + ((i * 7) % 900)
  const c = 100 + ((i * 11) % 900)
  return `+254 ${a} ${b} ${c}`
}

function deterministicAmount(i: number): number {
  return 500 + ((i * 7919 + 101) % 99500)
}

const BASE_TEMPLATES: Omit<ContributionRow, 'date'>[] = [
  { transactionId: 'UCFBP9F3N0', name: 'Juma Yusuf', phone: '+254 722 123 456', amount: 15000 },
  { transactionId: 'K9LMN2P4Q1', name: 'Michael Mathu', phone: '+254 733 987 654', amount: 24800 },
  { transactionId: 'R5STU8VWXY', name: 'Mary Wambui', phone: '+254 711 456 789', amount: 32800 },
  { transactionId: 'Z1AB2C3D4E', name: 'Peter Otieno', phone: '+254 722 111 222', amount: 40000 },
  { transactionId: 'F6GH7I8J9K', name: 'Grace Muthoni', phone: '+254 733 333 444', amount: 40000 },
]

function buildDemoRows(anchor: Date): ContributionRow[] {
  const base: ContributionRow[] = BASE_TEMPLATES.map((t, i) => ({
    ...t,
    date: formatDMY(addDays(anchor, -i)),
  }))
  const extra: ContributionRow[] = Array.from({ length: 80 }, (_, i) => {
    const dayOffset = (i % 35) + Math.floor(i / 20)
    return {
      transactionId: `X${String(i + 1).padStart(3, '0')}-${deterministicTxSuffix(i)}`,
      date: formatDMY(addDays(anchor, -dayOffset)),
      name: NAMES[(i * 5 + 2) % NAMES.length],
      phone: deterministicPhone(i),
      amount: deterministicAmount(i),
    }
  })
  return [...base, ...extra]
}

const INITIAL_VISIBLE = 20

export function useContributionsData() {
  const { token } = useAuth()
  const { mode } = useAppMode()
  const anchorDate = useMemo(() => startOfDay(new Date()), [])
  const [period, setPeriod] = useState<MetricPeriod>('last7')
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE)
  const [liveRows, setLiveRows] = useState<ContributionRow[]>([])
  const [liveTotalKes, setLiveTotalKes] = useState(0)
  const [liveTrendPct, setLiveTrendPct] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const demoRows = useMemo(() => buildDemoRows(anchorDate), [anchorDate])

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE)
  }, [period])

  useEffect(() => {
    if (mode === 'demo' || !token) {
      setLiveRows([])
      setLiveTotalKes(0)
      setLiveTrendPct(null)
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchContributions(period, token)
        if (cancelled) return
        setLiveRows(data.rows)
        setLiveTotalKes(data.totalKes)
        setLiveTrendPct(null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load contributions.')
          setLiveRows([])
          setLiveTotalKes(0)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [mode, token, period])

  const rows = mode === 'live' ? liveRows : demoRows

  const rowsInPeriod = useMemo(() => {
    if (mode === 'live') return rows
    return filterRowsByPeriod(rows, period, anchorDate)
  }, [mode, rows, period, anchorDate])

  const displayedRows = useMemo(
    () => rowsInPeriod.slice(0, visibleCount),
    [rowsInPeriod, visibleCount],
  )

  const hasMoreRows = visibleCount < rowsInPeriod.length

  const showAllRows = useCallback(() => {
    setVisibleCount(rowsInPeriod.length)
  }, [rowsInPeriod.length])

  const summaryAmount = useMemo(() => {
    if (mode === 'live') return liveTotalKes
    return sumAmountsForPeriod(rows, period, anchorDate)
  }, [mode, liveTotalKes, rows, period, anchorDate])

  const totalAmount = summaryAmount

  const summaryTrendPct =
    mode === 'live' && liveTrendPct != null ? `${Math.abs(liveTrendPct).toFixed(1)}%` : '15.8%'

  const periodSubtitle = METRIC_PERIOD_LABEL[period]

  return {
    rows,
    rowsInPeriod,
    rowCount: rowsInPeriod.length,
    displayedRows,
    hasMoreRows,
    showAllRows,
    totalAmount,
    summaryAmount,
    summaryTrendPct,
    period,
    setPeriod,
    periodSubtitle,
    loading,
    error,
  }
}
