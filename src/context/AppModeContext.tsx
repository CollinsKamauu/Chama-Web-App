/* Context + provider are intentionally co-located. */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react'
import { APP_MODE_STORAGE_KEY, readAppModeFromStorage, type AppMode } from '../lib/appMode'

export type AppModeContextValue = {
  mode: AppMode
  setMode: (mode: AppMode) => void
  isDemo: boolean
  isLive: boolean
}

export const AppModeContext = createContext<AppModeContextValue | null>(null)

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>(() =>
    typeof window !== 'undefined' ? readAppModeFromStorage() : 'demo',
  )

  const setMode = useCallback((next: AppMode) => {
    setModeState(next)
    try {
      localStorage.setItem(APP_MODE_STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(
    () => ({
      mode,
      setMode,
      isDemo: mode === 'demo',
      isLive: mode === 'live',
    }),
    [mode, setMode],
  )

  return <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>
}
