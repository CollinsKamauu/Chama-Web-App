const DEFAULT_BASE = 'https://milestone-chama-backend.onrender.com'

export function getApiBaseUrl(): string {
  const fromBaseEnv = import.meta.env.VITE_API_BASE_URL
  const fromLegacyEnv = import.meta.env.VITE_API_URL
  const fromEnv =
    (typeof fromBaseEnv === 'string' && fromBaseEnv.trim() !== '' && fromBaseEnv) ||
    (typeof fromLegacyEnv === 'string' && fromLegacyEnv.trim() !== '' && fromLegacyEnv) ||
    DEFAULT_BASE
  return fromEnv.replace(/\/$/, '')
}

function parseErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback
  const d = data as Record<string, unknown>
  const msg = d.message ?? d.error
  if (typeof msg === 'string') return msg
  if (Array.isArray(msg)) return msg.join(', ')
  if (msg && typeof msg === 'object' && 'message' in msg && typeof (msg as { message: string }).message === 'string') {
    return (msg as { message: string }).message
  }
  return fallback
}

export type AuthSuccess = {
  token: string
  email: string
  name?: string | null
}

function extractAuthPayload(data: Record<string, unknown>, fallbackEmail: string): AuthSuccess {
  const token =
    (typeof data.token === 'string' && data.token) ||
    (typeof data.access_token === 'string' && data.access_token) ||
    (typeof data.accessToken === 'string' && data.accessToken) ||
    ''

  if (!token) {
    throw new Error('Server did not return an auth token')
  }

  const user = (data.user ?? data.profile) as Record<string, unknown> | undefined
  const nameFromUser =
    user && typeof user === 'object'
      ? (user.name ?? user.fullName ?? user.displayName)
      : undefined
  const name =
    (typeof nameFromUser === 'string' && nameFromUser) ||
    (typeof data.name === 'string' && data.name) ||
    undefined

  const email =
    (user && typeof user.email === 'string' && user.email) ||
    (typeof data.email === 'string' && data.email) ||
    fallbackEmail

  return { token, email, name }
}

export async function registerUser(email: string, password: string): Promise<void> {
  const base = getApiBaseUrl()
  const res = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    throw new Error(parseErrorMessage(data, `Registration failed (${res.status})`))
  }
}

export async function loginUser(email: string, password: string): Promise<AuthSuccess> {
  const base = getApiBaseUrl()
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    throw new Error(parseErrorMessage(data, `Login failed (${res.status})`))
  }
  return extractAuthPayload(data, email)
}
