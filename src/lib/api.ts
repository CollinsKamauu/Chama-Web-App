import { getApiBaseUrl } from '../api/auth'
import { flattenApiRecord, withCamelAliases } from './api/parseApiFields'

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

function normalizeSuccessPayload<T>(payload: Record<string, unknown>): ApiResponse<T> {
  const apiPayload = payload as ApiPayload<T>
  const flat = withCamelAliases(flattenApiRecord(apiPayload as Record<string, unknown>))
  return {
    ...apiPayload,
    ...flat,
    success: true,
  }
}

function normalizeFailurePayload(payload: Record<string, unknown>, fallback: string): ApiResponse<never> {
  return {
    success: false,
    message: toErrorMessage(payload, fallback),
  }
}

export const api = {
  async post<T = unknown>(
    path: string,
    body: Record<string, unknown>,
    token?: string,
  ): Promise<ApiResponse<T>> {
    const url = import.meta.env.DEV ? path : `${getApiBaseUrl()}${path}`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })
    const payload = await parseJson(response)
    if (!response.ok || payload.success === false) {
      return normalizeFailurePayload(payload, `Request failed (${response.status})`)
    }
    return normalizeSuccessPayload<T>(payload)
  },

  async get<T = unknown>(path: string, token?: string): Promise<ApiResponse<T>> {
    const url = import.meta.env.DEV ? path : `${getApiBaseUrl()}${path}`
    const response = await fetch(url, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    const payload = await parseJson(response)
    if (!response.ok || payload.success === false) {
      return normalizeFailurePayload(payload, `Request failed (${response.status})`)
    }
    return normalizeSuccessPayload<T>(payload)
  },

  async patch<T = unknown>(
    path: string,
    body: Record<string, unknown>,
    token?: string,
  ): Promise<ApiResponse<T>> {
    const url = import.meta.env.DEV ? path : `${getApiBaseUrl()}${path}`
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })
    const payload = await parseJson(response)
    if (!response.ok || payload.success === false) {
      return normalizeFailurePayload(payload, `Request failed (${response.status})`)
    }
    return normalizeSuccessPayload<T>(payload)
  },

  async delete(path: string, token?: string): Promise<ApiResponse<unknown>> {
    const url = import.meta.env.DEV ? path : `${getApiBaseUrl()}${path}`
    const response = await fetch(url, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    const payload = await parseJson(response)
    if (!response.ok || payload.success === false) {
      return normalizeFailurePayload(payload, `Request failed (${response.status})`)
    }
    return normalizeSuccessPayload(payload)
  },
}
