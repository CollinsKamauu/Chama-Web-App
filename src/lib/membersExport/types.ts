import type { MemberRow } from '../../types/members'

export type MembersExportFormat = 'PDF' | 'Excel' | 'Doc' | 'CSV'

export type MembersExportPayload = {
  rows: MemberRow[]
  exportedAt: Date
}
