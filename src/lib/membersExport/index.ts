import { maskPhoneLastSixDigits } from '../contributionsExport/maskPhone'
import { exportMembersCsv } from './exportMembersCsv'
import { exportMembersDocx } from './exportMembersDocx'
import { exportMembersPdf } from './exportMembersPdf'
import { exportMembersXlsx } from './exportMembersXlsx'
import type { MembersExportFormat, MembersExportPayload } from './types'

export type { MembersExportFormat, MembersExportPayload } from './types'

export async function runMembersExport(format: MembersExportFormat, payload: MembersExportPayload): Promise<void> {
  const rows = payload.rows.map((r) => ({ ...r, phone: maskPhoneLastSixDigits(r.phone) }))
  const { exportedAt } = payload

  switch (format) {
    case 'PDF':
      await exportMembersPdf(rows, exportedAt)
      return
    case 'Excel':
      await exportMembersXlsx(rows, exportedAt)
      return
    case 'Doc':
      await exportMembersDocx(rows, exportedAt)
      return
    case 'CSV':
      exportMembersCsv(rows, exportedAt)
      return
    default: {
      const _exhaustive: never = format
      return _exhaustive
    }
  }
}
