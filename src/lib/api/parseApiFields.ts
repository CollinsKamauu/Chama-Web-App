/** Read a numeric field from an API payload, trying camelCase and snake_case keys. */
export function pickNumber(source: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return 0
}

export function pickString(source: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return undefined
}

export function pickArray<T>(source: Record<string, unknown>, ...keys: string[]): T[] {
  for (const key of keys) {
    const value = source[key]
    if (Array.isArray(value)) return value as T[]
  }
  return []
}

/** Flatten `{ data: {...} }`, nested `summary`, or snake_case payloads into one object. */
export function flattenApiRecord(payload: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...payload }

  const data = payload.data
  if (data != null && typeof data === 'object' && !Array.isArray(data)) {
    Object.assign(out, data as Record<string, unknown>)
  }

  const summary = out.summary
  if (summary != null && typeof summary === 'object' && !Array.isArray(summary)) {
    Object.assign(out, summary as Record<string, unknown>)
  }

  return out
}

export function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

/** Copy snake_case keys onto camelCase aliases when camelCase is missing. */
export function withCamelAliases(source: Record<string, unknown>): Record<string, unknown> {
  const out = { ...source }
  for (const [key, value] of Object.entries(source)) {
    if (key.includes('_')) {
      const camel = snakeToCamel(key)
      if (out[camel] === undefined) out[camel] = value
    }
  }
  return out
}

export function normalizeApiRecord(payload: Record<string, unknown>): Record<string, unknown> {
  return withCamelAliases(flattenApiRecord(payload))
}
