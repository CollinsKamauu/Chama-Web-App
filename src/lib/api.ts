import { getApiBaseUrl } from '../api/auth'

type ApiResponse<T = unknown> = {
  success: boolean
  message?: string
  token?: string
  data?: T
  [key: string]: unknown
}

type ApiPayload<T = unknown> = Omit<ApiResponse<T>, 'success'>

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
    const url = import.meta.env.DEV ? path : `${getApiBaseUrl()}${path}`
    const response = await fetch(url, {
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
    const apiPayload = payload as ApiPayload<T>
    return {
      ...apiPayload,
      success: true,
    }
  },

  async get<T = unknown>(path: string, token?: string): Promise<ApiResponse<T>> {
    const url = import.meta.env.DEV ? path : `${getApiBaseUrl()}${path}`
    const response = await fetch(url, {
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
    const apiPayload = payload as ApiPayload<T>
    return {
      ...apiPayload,
      success: true,
    }
  },
}
