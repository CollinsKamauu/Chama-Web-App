import { getApiBaseUrl } from '../api/auth'

type ApiResponse<T = unknown> = {
  success: boolean
  message?: string
  token?: string
  data?: T
  [key: string]: unknown
}

async function parseJson(response: Response): Promise<Record<string, unknown>> {
  return (await response.json().catch(() => ({}))) as Record<string, unknown>
}

function toErrorMessage(payload: Record<string, unknown>, fallback: string): string {
  const message = payload.message ?? payload.error
  if (typeof message === 'string' && message.trim()) return message
  return fallback
}

export const api = {
  async post<T = unknown>(path: string, body: Record<string, unknown>): Promise<ApiResponse<T>> {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const payload = await parseJson(response)
    if (!response.ok) {
      return {
        success: false,
        message: toErrorMessage(payload, `Request failed (${response.status})`),
      }
    }
    return {
      success: true,
      ...(payload as ApiResponse<T>),
    }
  },

  async get<T = unknown>(path: string, token?: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    const payload = await parseJson(response)
    if (!response.ok) {
      return {
        success: false,
        message: toErrorMessage(payload, `Request failed (${response.status})`),
      }
    }
    return {
      success: true,
      ...(payload as ApiResponse<T>),
    }
  },
}
