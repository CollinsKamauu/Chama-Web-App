import type { ContributionRow } from '../../hooks/useContributionsData'
import { downloadBlob, formatExportDateLong, formatExportStamp } from './download'

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export function exportContributionsCsv(
  rows: ContributionRow[],
  periodLabel: string,
  exportedAt: Date,
): void {
  const lines: string[] = []
  lines.push(csvEscape('Milestone Fraternity'))
  lines.push('')
  lines.push(csvEscape('Contributions'))
  lines.push(`${csvEscape('Date')},${csvEscape(formatExportDateLong(exportedAt))}`)
  lines.push(`${csvEscape('For the period')},${csvEscape(periodLabel)}`)
  lines.push('')
  lines.push(
    ['Transaction ID', 'Date', 'Name', 'Phone Number', 'Amount (KES)'].map(csvEscape).join(','),
  )
  for (const r of rows) {
    lines.push(
      [
        csvEscape(r.transactionId),
        csvEscape(r.date),
        csvEscape(r.name),
        csvEscape(r.phone),
        csvEscape(r.amount.toLocaleString('en-US')),
      ].join(','),
    )
  }
  const total = rows.reduce((s, r) => s + r.amount, 0)
  lines.push('')
  lines.push(`${csvEscape('Total')},,,,${csvEscape(total.toLocaleString('en-US'))}`)

  const body = `\uFEFF${lines.join('\r\n')}`
  downloadBlob(new Blob([body], { type: 'text/csv;charset=utf-8' }), `milestone-fraternity-contributions-${formatExportStamp(exportedAt)}.csv`)
}
