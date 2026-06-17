import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchCurrentUser, loginUser, registerUser } from '../api/auth'
import {
  getChamaOrganizationName,
  setChamaOrganizationNameInStorage,
} from '../lib/chamaOrganizationName'

const STORAGE_TOKEN = 'chama_token'
const STORAGE_EMAIL = 'chama_email'
const STORAGE_NAME = 'chama_display_name'

function readStoredDisplayName(): string {
  return localStorage.getItem(STORAGE_NAME) || ''
}

async function resolveDisplayName(token: string, email: string, fallbackName?: string | null): Promise<string> {
  try {
    const profile = await fetchCurrentUser(token)
    if (profile.name.trim()) return profile.name.trim()
    if (profile.email.trim()) return profile.email.split('@')[0] || 'Member'
  } catch {
    /* fall through to cached / login payload */
  }
  if (fallbackName?.trim()) return fallbackName.trim()
  const cached = readStoredDisplayName()
  if (cached.trim()) return cached.trim()
  return email.split('@')[0] || 'Member'
}

type AuthContextValue = {
  token: string | null
  email: string
  displayName: string
  chamaOrganizationName: string
  setChamaOrganizationName: (name: string) => void
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string, inviteCode: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_TOKEN))
  const [email, setEmail] = useState(() => localStorage.getItem(STORAGE_EMAIL) || '')
  const [displayName, setDisplayName] = useState(() => readStoredDisplayName())
  const [chamaOrganizationName, setChamaOrganizationNameState] = useState(() =>
    getChamaOrganizationName(),
  )

  useEffect(() => {
    const t = localStorage.getItem(STORAGE_TOKEN)
    const em = localStorage.getItem(STORAGE_EMAIL) || ''
    if (!t || !em) return
    let cancelled = false
    void resolveDisplayName(t, em).then((name) => {
      if (cancelled) return
      localStorage.setItem(STORAGE_NAME, name)
      setDisplayName(name)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const setChamaOrganizationName = useCallback((name: string) => {
    setChamaOrganizationNameInStorage(name)
    setChamaOrganizationNameState(getChamaOrganizationName())
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_TOKEN)
    localStorage.removeItem(STORAGE_EMAIL)
    localStorage.removeItem(STORAGE_NAME)
    setToken(null)
    setEmail('')
    setDisplayName('')
  }, [])

  const login = useCallback(async (loginEmail: string, password: string) => {
    const res = await loginUser(loginEmail, password)
    const resolvedName = await resolveDisplayName(res.token, res.email, res.name)

    localStorage.setItem(STORAGE_TOKEN, res.token)
    localStorage.setItem(STORAGE_EMAIL, res.email)
    localStorage.setItem(STORAGE_NAME, resolvedName)
    setToken(res.token)
    setEmail(res.email)
    setDisplayName(resolvedName)
  }, [])

  const signup = useCallback(
    async (name: string, signupEmail: string, password: string, inviteCode: string) => {
      await registerUser(signupEmail, password, name, inviteCode)
    },
    [],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      email,
      displayName,
      chamaOrganizationName,
      setChamaOrganizationName,
      isAuthenticated: Boolean(token),
      login,
      signup,
      logout,
    }),
    [token, email, displayName, chamaOrganizationName, setChamaOrganizationName, login, signup, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
