import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loginUser, registerUser } from '../api/auth'
import {
  getChamaOrganizationName,
  setChamaOrganizationNameInStorage,
} from '../lib/chamaOrganizationName'

const STORAGE_TOKEN = 'chama_token'
const STORAGE_EMAIL = 'chama_email'
const STORAGE_NAME = 'chama_display_name'
/** Maps lowercase email → display name captured at sign-up until backend stores profile */
const LOCAL_NAMES_KEY = 'chama_local_names'

type LocalNameMap = Record<string, string>

function readLocalNames(): LocalNameMap {
  try {
    const raw = localStorage.getItem(LOCAL_NAMES_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as LocalNameMap
  } catch {
    return {}
  }
}

function writeLocalName(email: string, name: string) {
  const key = email.trim().toLowerCase()
  const map = readLocalNames()
  map[key] = name.trim()
  localStorage.setItem(LOCAL_NAMES_KEY, JSON.stringify(map))
}

function readStoredDisplayName(): string {
  return localStorage.getItem(STORAGE_NAME) || ''
}

type AuthContextValue = {
  token: string | null
  email: string
  displayName: string
  chamaOrganizationName: string
  setChamaOrganizationName: (name: string) => void
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
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
    if (readStoredDisplayName().trim()) return
    const fromMap = readLocalNames()[em.toLowerCase()]
    const resolved = (fromMap && fromMap.trim()) || em.split('@')[0] || 'Member'
    localStorage.setItem(STORAGE_NAME, resolved)
    setDisplayName(resolved)
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
    const localMap = readLocalNames()
    const fromSignup = localMap[loginEmail.trim().toLowerCase()]
    const resolvedName =
      (res.name && res.name.trim()) ||
      (fromSignup && fromSignup.trim()) ||
      res.email.split('@')[0] ||
      'Member'

    localStorage.setItem(STORAGE_TOKEN, res.token)
    localStorage.setItem(STORAGE_EMAIL, res.email)
    localStorage.setItem(STORAGE_NAME, resolvedName)
    setToken(res.token)
    setEmail(res.email)
    setDisplayName(resolvedName)
  }, [])

  const signup = useCallback(async (name: string, signupEmail: string, password: string) => {
    await registerUser(signupEmail, password)
    writeLocalName(signupEmail, name)
  }, [])

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
