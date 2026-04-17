import type { ContributionRow } from '../../hooks/useContributionsData'

export type ContributionsExportFormat = 'PDF' | 'Excel' | 'Doc' | 'CSV'

export type ContributionsExportPayload = {
  rows: ContributionRow[]
  periodLabel: string
  exportedAt: Date
}
