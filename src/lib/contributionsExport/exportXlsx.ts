import ExcelJS from 'exceljs'
import type { ContributionRow } from '../../hooks/useContributionsData'
import { downloadBlob, formatExportDateLong, formatExportStamp } from './download'

const BLUE_ARGB = 'FF2070D2'
const GRAY_ARGB = 'FF6B7280'
const TITLE_ARGB = 'FF111827'

const META_ROW_COUNT = 5

export async function exportContributionsXlsx(
  rows: ContributionRow[],
  periodLabel: string,
  exportedAt: Date,
): Promise<void> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Contributions', {
    views: [{ showGridLines: false }],
  })

  for (let i = 1; i <= 4; i += 1) {
    ws.mergeCells(i, 1, i, 5)
  }
  ws.mergeCells(5, 1, 5, 5)

  const title = ws.getCell(1, 1)
  title.value = 'Milestone Fraternity'
  title.font = { bold: true, size: 14, name: 'Arial', color: { argb: TITLE_ARGB } }
  ws.getRow(1).height = 24

  const subtitle = ws.getCell(2, 1)
  subtitle.value = 'Chama Contributions'
  subtitle.font = { bold: true, size: 12, name: 'Arial', color: { argb: TITLE_ARGB } }
  ws.getRow(2).height = 22

  const dateCell = ws.getCell(3, 1)
  dateCell.value = `Date:  ${formatExportDateLong(exportedAt)}`
  dateCell.font = { name: 'Arial', size: 12, color: { argb: GRAY_ARGB } }
  ws.getRow(3).height = 22

  const periodCell = ws.getCell(4, 1)
  periodCell.value = `For the period:  ${periodLabel}`
  periodCell.font = { name: 'Arial', size: 12, color: { argb: GRAY_ARGB } }
  ws.getRow(4).height = 22

  ws.getRow(5).height = 12

  const headerRow = META_ROW_COUNT + 1
  const headers = ['Transaction ID', 'Date', 'Name', 'Phone Number', 'Amount']
  headers.forEach((h, i) => {
    const c = ws.getCell(headerRow, i + 1)
    c.value = h
    c.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 11 }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE_ARGB } }
    c.alignment = { vertical: 'middle', horizontal: i === 4 ? 'right' : 'left' }
  })
  ws.getRow(headerRow).height = 28

  let r = headerRow + 1
  for (const row of rows) {
    ws.getCell(r, 1).value = row.transactionId
    ws.getCell(r, 2).value = row.date
    ws.getCell(r, 3).value = row.name
    ws.getCell(r, 4).value = row.phone
    ws.getCell(r, 5).value = row.amount
    ws.getCell(r, 5).numFmt = '#,##0'
    ws.getCell(r, 5).alignment = { horizontal: 'right' }
    for (let c = 1; c <= 5; c += 1) {
      const cell = ws.getCell(r, c)
      cell.font = { name: 'Arial', size: 11 }
      cell.alignment = { vertical: 'middle', ...(c === 5 ? { horizontal: 'right' } : { horizontal: 'left' }) }
    }
    ws.getRow(r).height = 24
    r += 1
  }

  const total = rows.reduce((s, x) => s + x.amount, 0)
  ws.mergeCells(r, 1, r, 4)
  ws.getCell(r, 1).value = 'Total'
  ws.getCell(r, 1).font = { bold: true, name: 'Arial', size: 11 }
  ws.getCell(r, 1).alignment = { horizontal: 'right', vertical: 'middle' }
  ws.getCell(r, 5).value = total
  ws.getCell(r, 5).numFmt = '#,##0'
  ws.getCell(r, 5).font = { bold: true, name: 'Arial', size: 11 }
  ws.getCell(r, 5).alignment = { horizontal: 'right', vertical: 'middle' }
  ws.getRow(r).height = 26

  ws.columns = [{ width: 22 }, { width: 14 }, { width: 28 }, { width: 22 }, { width: 16 }]

  const buf = await wb.xlsx.writeBuffer()
  downloadBlob(
    new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `milestone-fraternity-contributions-${formatExportStamp(exportedAt)}.xlsx`,
  )
}
