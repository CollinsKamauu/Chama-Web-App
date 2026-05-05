import { useCallback, useEffect, useState } from 'react'
import { useAppMode } from './useAppMode'
import { DEMO_MOCK_WORKING_BALANCE_KES } from '../lib/appMode'
import { api } from '../lib/api'
import { mpesaClientRoutes } from '../lib/mpesa-config'

export type MpesaBalanceState = {
  balanceKes: number | null
  loading: boolean
  stale: boolean
  hint: string | null
  error: string | null
  refresh: () => void
}

export function useMpesaWorkingBalance(): MpesaBalanceState {
  const { mode } = useAppMode()
  const [balanceKes, setBalanceKes] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [stale, setStale] = useState(true)
  const [hint, setHint] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => {
    setTick((t) => t + 1)
  }, [])

  useEffect(() => {
    if (mode === 'demo') {
      let cancelled = false
      queueMicrotask(() => {
        if (cancelled) return
        setBalanceKes(DEMO_MOCK_WORKING_BALANCE_KES)
        setLoading(false)
        setStale(false)
        setHint(null)
        setError(null)
      })
      return () => {
        cancelled = true
      }
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      const r = await api.get<{ balanceKes?: number | null; stale?: boolean; hint?: string }>(
        mpesaClientRoutes.balance,
      )
      if (cancelled) return
      if (!r.success) {
        setError(typeof r.message === 'string' ? r.message : 'Could not load balance.')
        setBalanceKes(null)
        setStale(true)
        setHint(null)
      } else {
        const b = r.balanceKes
        setBalanceKes(typeof b === 'number' && Number.isFinite(b) ? b : null)
        setStale(Boolean(r.stale))
        setHint(typeof r.hint === 'string' ? r.hint : null)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [tick, mode])

  return { balanceKes, loading, stale, hint, error, refresh }
}
