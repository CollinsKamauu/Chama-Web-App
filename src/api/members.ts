import { api } from '../lib/api'
import type { MemberRole, MemberRow } from '../types/members'

type MemberApiRow = {
  id: string
  name: string
  phone: string
  email?: string | null
  role?: string | null
  contributions?: number | null
}

function toMemberRole(role: string | null | undefined): MemberRole {
  const valid: MemberRole[] = [
    'Chairperson',
    'Treasurer',
    'Secretary',
    'Vice Chairperson',
    'Board Member',
    'Member',
  ]
  if (role && valid.includes(role as MemberRole)) return role as MemberRole
  return 'Member'
}

export function mapMemberApiRow(row: MemberApiRow): MemberRow {
  return {
    id: String(row.id),
    name: row.name,
    phone: row.phone,
    role: toMemberRole(row.role),
    contributions: Number(row.contributions) || 0,
  }
}

function extractMemberRows(res: Record<string, unknown>): MemberApiRow[] {
  if (Array.isArray(res.data)) return res.data as MemberApiRow[]
  if (Array.isArray(res.rows)) return res.rows as MemberApiRow[]
  if (Array.isArray(res)) return res as MemberApiRow[]
  return []
}

export async function fetchMembers(token: string): Promise<MemberRow[]> {
  const res = await api.get<MemberApiRow[]>('/api/members', token)
  if (!res.success) {
    throw new Error(typeof res.message === 'string' ? res.message : 'Could not load members.')
  }
  return extractMemberRows(res as Record<string, unknown>).map(mapMemberApiRow)
}

function memberFromResponse(
  res: Record<string, unknown>,
  fallback: Partial<MemberApiRow> = {},
): MemberApiRow {
  return {
    id: String(res.id ?? fallback.id ?? ''),
    name: String(res.name ?? fallback.name ?? ''),
    phone: String(res.phone ?? fallback.phone ?? ''),
    email: (res.email as string | null | undefined) ?? fallback.email,
    role: (res.role as string | null | undefined) ?? fallback.role,
    contributions: (res.contributions as number | null | undefined) ?? fallback.contributions,
  }
}

export async function createMember(
  token: string,
  payload: { name: string; phone: string; email?: string },
): Promise<MemberRow> {
  const res = await api.post<MemberApiRow>('/api/members', payload, token)
  if (!res.success) {
    throw new Error(typeof res.message === 'string' ? res.message : 'Could not add member.')
  }
  return mapMemberApiRow(memberFromResponse(res as Record<string, unknown>, payload))
}

export async function updateMemberRole(
  token: string,
  memberId: string,
  role: MemberRole,
): Promise<MemberRow> {
  const res = await api.patch<MemberApiRow>(
    `/api/members/${encodeURIComponent(memberId)}/role`,
    { role },
    token,
  )
  if (!res.success) {
    throw new Error(typeof res.message === 'string' ? res.message : 'Could not update role.')
  }
  return mapMemberApiRow(memberFromResponse(res as Record<string, unknown>, { id: memberId, role }))
}

export async function deleteMember(token: string, memberId: string): Promise<void> {
  const res = await api.delete(`/api/members/${encodeURIComponent(memberId)}`, token)
  if (!res.success) {
    throw new Error(typeof res.message === 'string' ? res.message : 'Could not delete member.')
  }
}
