import type { ExpenditureRow } from '../../types/finances'
import { downloadBlob, formatExportDateLong, formatExportStamp } from '../contributionsExport/download'

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export function exportExpenditureCsv(
  rows: ExpenditureRow[],
  periodLabel: string,
  exportedAt: Date,
): void {
  const lines: string[] = []
  lines.push(csvEscape('Milestone Fraternity'))
  lines.push('')
  lines.push(csvEscape('Expenditures'))
  lines.push(`${csvEscape('Date')},${csvEscape(formatExportDateLong(exportedAt))}`)
  lines.push(`${csvEscape('For the period')},${csvEscape(periodLabel)}`)
  lines.push('')
  lines.push(
    ['Transaction ID', 'Date', 'Name', 'Phone Number', 'Type', 'Amount (KES)'].map(csvEscape).join(','),
  )
  for (const r of rows) {
    lines.push(
      [
        csvEscape(r.transactionId),
        csvEscape(r.date),
        csvEscape(r.name),
        csvEscape(r.phone),
        csvEscape(r.type),
        csvEscape(r.amount.toLocaleString('en-US')),
      ].join(','),
    )
  }
  const total = rows.reduce((s, x) => s + x.amount, 0)
  lines.push('')
  lines.push(`${csvEscape('Total')},,,,,${csvEscape(total.toLocaleString('en-US'))}`)

  const body = `\uFEFF${lines.join('\r\n')}`
  downloadBlob(
    new Blob([body], { type: 'text/csv;charset=utf-8' }),
    `milestone-fraternity-expenditures-${formatExportStamp(exportedAt)}.csv`,
  )
}
