import ExcelJS from 'exceljs'
import type { MemberRow } from '../../types/members'
import { downloadBlob, formatExportDateLong, formatExportStamp } from '../contributionsExport/download'

const BLUE_ARGB = 'FF2070D2'
const GRAY_ARGB = 'FF6B7280'
const TITLE_ARGB = 'FF111827'

const META_ROW_COUNT = 5

export async function exportMembersXlsx(rows: MemberRow[], exportedAt: Date): Promise<void> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Members', { views: [{ showGridLines: false }] })

  for (let i = 1; i <= 4; i += 1) {
    ws.mergeCells(i, 1, i, 4)
  }
  ws.mergeCells(5, 1, 5, 4)

  ws.getCell(1, 1).value = 'Milestone Fraternity'
  ws.getCell(1, 1).font = { bold: true, size: 14, name: 'Arial', color: { argb: TITLE_ARGB } }
  ws.getRow(1).height = 24

  ws.getCell(2, 1).value = 'Chama Members'
  ws.getCell(2, 1).font = { bold: true, size: 12, name: 'Arial', color: { argb: TITLE_ARGB } }
  ws.getRow(2).height = 22

  ws.getCell(3, 1).value = `Date:  ${formatExportDateLong(exportedAt)}`
  ws.getCell(3, 1).font = { name: 'Arial', size: 12, color: { argb: GRAY_ARGB } }
  ws.getRow(3).height = 22

  ws.getCell(4, 1).value = `Total Registered Members:  ${rows.length.toLocaleString('en-US')}`
  ws.getCell(4, 1).font = { name: 'Arial', size: 12, color: { argb: GRAY_ARGB } }
  ws.getRow(4).height = 22

  ws.getRow(5).height = 12

  const headerRow = META_ROW_COUNT + 1
  const headers = ['Name', 'Phone Number', 'Role', 'Contributions']
  headers.forEach((h, i) => {
    const c = ws.getCell(headerRow, i + 1)
    c.value = h
    c.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 11 }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE_ARGB } }
    c.alignment = { vertical: 'middle', horizontal: i === 3 ? 'right' : 'left' }
  })
  ws.getRow(headerRow).height = 28

  let r = headerRow + 1
  for (const row of rows) {
    ws.getCell(r, 1).value = row.name
    ws.getCell(r, 2).value = row.phone
    ws.getCell(r, 3).value = row.role
    ws.getCell(r, 4).value = row.contributions
    ws.getCell(r, 4).numFmt = '#,##0'
    ws.getCell(r, 4).alignment = { horizontal: 'right' }
    for (let c = 1; c <= 4; c += 1) {
      const cell = ws.getCell(r, c)
      cell.font = { name: 'Arial', size: 11 }
      cell.alignment = { vertical: 'middle', ...(c === 4 ? { horizontal: 'right' } : { horizontal: 'left' }) }
    }
    ws.getRow(r).height = 24
    r += 1
  }

  ws.columns = [{ width: 28 }, { width: 22 }, { width: 24 }, { width: 18 }]

  const buf = await wb.xlsx.writeBuffer()
  downloadBlob(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `milestone-fraternity-members-${formatExportStamp(exportedAt)}.xlsx`,
  )
}
