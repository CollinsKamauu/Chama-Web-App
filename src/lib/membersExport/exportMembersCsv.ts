import type { MemberRow } from '../../types/members'
import { downloadBlob, formatExportDateLong, formatExportStamp } from '../contributionsExport/download'

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export function exportMembersCsv(rows: MemberRow[], exportedAt: Date): void {
  const lines: string[] = []
  lines.push(csvEscape('Milestone Fraternity'))
  lines.push('')
  lines.push(csvEscape('Chama Members'))
  lines.push(`${csvEscape('Date')},${csvEscape(formatExportDateLong(exportedAt))}`)
  lines.push(`${csvEscape('Total Registered Members')},${csvEscape(rows.length.toLocaleString('en-US'))}`)
  lines.push('')
  lines.push(['Name', 'Phone Number', 'Role', 'Contributions (KES)'].map(csvEscape).join(','))
  for (const r of rows) {
    lines.push(
      [
        csvEscape(r.name),
        csvEscape(r.phone),
        csvEscape(r.role),
        csvEscape(r.contributions.toLocaleString('en-US')),
      ].join(','),
    )
  }

  const body = `\uFEFF${lines.join('\r\n')}`
  downloadBlob(new Blob([body], { type: 'text/csv;charset=utf-8' }), `milestone-fraternity-members-${formatExportStamp(exportedAt)}.csv`)
}
