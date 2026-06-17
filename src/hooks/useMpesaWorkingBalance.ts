import { useCallback, useEffect, useState } from 'react'
import { fetchMpesaBalance } from '../api/finances'
import { DEMO_MOCK_WORKING_BALANCE_KES } from '../lib/appMode'
import { useAppMode } from './useAppMode'
import { useEffectiveToken } from './useEffectiveToken'

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
  const token = useEffectiveToken()
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

    if (!token) {
      setBalanceKes(null)
      setLoading(false)
      setStale(true)
      setHint(null)
      setError('Sign in to load live M-Pesa balance.')
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchMpesaBalance(token)
        if (cancelled) return
        setBalanceKes(result.balanceKes)
        setStale(result.stale)
        setHint(result.hint ?? null)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Could not load balance.')
        setBalanceKes(null)
        setStale(true)
        setHint(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [tick, mode, token])

  return { balanceKes, loading, stale, hint, error, refresh }
}
