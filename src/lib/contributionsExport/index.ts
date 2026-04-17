import type { ContributionsExportFormat, ContributionsExportPayload } from './types'
import { maskPhoneLastSixDigits } from './maskPhone'
import { exportContributionsCsv } from './exportCsv'
import { exportContributionsDocx } from './exportDocx'
import { exportContributionsPdf } from './exportPdf'
import { exportContributionsXlsx } from './exportXlsx'

export type { ContributionsExportFormat, ContributionsExportPayload } from './types'
export { maskPhoneLastSixDigits } from './maskPhone'

export async function runContributionsExport(
  format: ContributionsExportFormat,
  payload: ContributionsExportPayload,
): Promise<void> {
  const rows = payload.rows.map((r) => ({ ...r, phone: maskPhoneLastSixDigits(r.phone) }))
  const { periodLabel, exportedAt } = payload

  switch (format) {
    case 'PDF':
      await exportContributionsPdf(rows, periodLabel, exportedAt)
      return
    case 'Excel':
      await exportContributionsXlsx(rows, periodLabel, exportedAt)
      return
    case 'Doc':
      await exportContributionsDocx(rows, periodLabel, exportedAt)
      return
    case 'CSV':
      exportContributionsCsv(rows, periodLabel, exportedAt)
      return
    default: {
      const _exhaustive: never = format
      return _exhaustive
    }
  }
}
