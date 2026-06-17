import { useAuth } from '../context/AuthContext'

const STORAGE_TOKEN = 'chama_token'

/** Auth token from context, falling back to localStorage (e.g. after login reload). */
export function useEffectiveToken(): string | null {
  const { token } = useAuth()
  if (token) return token
  try {
    return localStorage.getItem(STORAGE_TOKEN)
  } catch {
    return null
  }
}
