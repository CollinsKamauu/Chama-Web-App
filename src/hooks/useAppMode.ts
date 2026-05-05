import { useContext } from 'react'
import { AppModeContext } from '../context/AppModeContext'

export function useAppMode() {
  const ctx = useContext(AppModeContext)
  if (!ctx) {
    throw new Error('useAppMode must be used within AppModeProvider')
  }
  return ctx
}
