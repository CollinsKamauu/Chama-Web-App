import { useCallback, useEffect, useState } from 'react'
import { createMember, deleteMember, fetchMembers, updateMemberRole } from '../api/members'
import type { NewMemberPayload } from '../components/AddMemberModal'
import { useAuth } from '../context/AuthContext'
import { buildDemoMembers } from '../lib/membersDemoData'
import type { MemberRole, MemberRow } from '../types/members'
import { useAppMode } from './useAppMode'

export function useMembers() {
  const { token } = useAuth()
  const { mode } = useAppMode()
  const [members, setMembers] = useState<MemberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMembers = useCallback(async () => {
    if (mode === 'demo') {
      setMembers(buildDemoMembers())
      setError(null)
      setLoading(false)
      return
    }

    if (!token) {
      setMembers([])
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const rows = await fetchMembers(token)
      setMembers(rows)
    } catch (err) {
      setMembers([])
      setError(err instanceof Error ? err.message : 'Could not load members.')
    } finally {
      setLoading(false)
    }
  }, [mode, token])

  useEffect(() => {
    void loadMembers()
  }, [loadMembers])

  const addMember = useCallback(
    async (payload: NewMemberPayload) => {
      if (mode === 'demo') {
        const row: MemberRow = {
          id: `m${Date.now()}`,
          name: payload.fullName,
          phone: payload.phone,
          role: payload.role,
          contributions: 0,
        }
        setMembers((prev) => [row, ...prev])
        return
      }

      if (!token) throw new Error('You must be signed in to add a member.')
      const created = await createMember(token, { name: payload.fullName, phone: payload.phone })
      const row =
        payload.role !== created.role
          ? await updateMemberRole(token, created.id, payload.role)
          : created
      setMembers((prev) => [row, ...prev])
    },
    [mode, token],
  )

  const changeRole = useCallback(
    async (memberId: string, role: MemberRole) => {
      if (mode === 'demo') {
        setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role } : m)))
        return
      }

      if (!token) throw new Error('You must be signed in to update a role.')
      const updated = await updateMemberRole(token, memberId, role)
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)))
    },
    [mode, token],
  )

  const removeMember = useCallback(
    async (memberId: string) => {
      if (mode === 'demo') {
        setMembers((prev) => prev.filter((m) => m.id !== memberId))
        return
      }

      if (!token) throw new Error('You must be signed in to delete a member.')
      await deleteMember(token, memberId)
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
    },
    [mode, token],
  )

  return {
    members,
    loading,
    error,
    reload: loadMembers,
    addMember,
    changeRole,
    removeMember,
  }
}
