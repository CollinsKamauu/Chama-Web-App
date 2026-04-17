import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ContributionRow } from '../../hooks/useContributionsData'
import { downloadBlob, formatExportDateLong, formatExportStamp } from './download'
import { rasterizeSvgFromUrl } from './rasterizeSvg'

/** Matches `public/export-templates/export-contributions-template-4.svg`. */
const TEMPLATE_BLUE_RGB: [number, number, number] = [32, 112, 210]

/** SVG design size (viewBox) from template — used to map table placement to A4 (mm). */
const TEMPLATE_W = 2480.315
const TEMPLATE_H = 3507.874

/** Table starts below “For the period:” (Template 3 has no lower card block). */
const TABLE_START_Y_SVG = 948
const TABLE_PAD_BELOW_RULE_SVG = 14

/** Full-width data band (~8.8% side margins). */
const TABLE_LEFT_SVG = 217.442
const TABLE_WIDTH_SVG = 2064.857

/** Dynamic value position beside labels (absolute SVG coords from Template 3). */
const DATE_VALUE_X_SVG = 720
const DATE_LABEL_BASELINE_Y_SVG = 382.707198 + 404.041
const PERIOD_LABEL_BASELINE_Y_SVG = 462.284555 + 404.041

const TOP_BAR_MM = 5

function uint8ToDataUrlPng(u8: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < u8.length; i += 1) binary += String.fromCharCode(u8[i]!)
  return `data:image/png;base64,${btoa(binary)}`
}

function svgYToMm(ySvg: number, pageH: number): number {
  return (ySvg / TEMPLATE_H) * pageH
}

function svgDxToMm(dxSvg: number, pageW: number): number {
  return (dxSvg / TEMPLATE_W) * pageW
}

/** Normalize display date to DD/MM/YYYY when possible. */
function formatDateCell(raw: string): string {
  const parts = raw.split('/')
  if (parts.length === 3) {
    const d = Number.parseInt(parts[0], 10)
    const m = Number.parseInt(parts[1], 10)
    const y = Number.parseInt(parts[2], 10)
    if (!Number.isNaN(d) && !Number.isNaN(m) && !Number.isNaN(y)) {
      return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
    }
  }
  return raw
}

export async function exportContributionsPdf(
  rows: ContributionRow[],
  periodLabel: string,
  exportedAt: Date,
): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  const marginLeft = svgDxToMm(TABLE_LEFT_SVG, pageW)
  const tableWidth = svgDxToMm(TABLE_WIDTH_SVG, pageW)
  const marginRight = pageW - marginLeft - tableWidth

  const startY = svgYToMm(TABLE_START_Y_SVG + TABLE_PAD_BELOW_RULE_SVG, pageH)

  const origin = window.location.origin
  const templateUrl = `${origin}/export-templates/export-contributions-template-4.svg`

  try {
    const templatePng = await rasterizeSvgFromUrl(templateUrl, Math.round(TEMPLATE_W), Math.round(TEMPLATE_H))
    doc.addImage(uint8ToDataUrlPng(templatePng), 'PNG', 0, 0, pageW, pageH)
    /* Template 4: labels only; fill values at 12pt (#6b6b6b). */
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(107, 107, 107)
    const valueX = svgDxToMm(DATE_VALUE_X_SVG, pageW)
    doc.text(formatExportDateLong(exportedAt), valueX, svgYToMm(DATE_LABEL_BASELINE_Y_SVG, pageH))
    doc.text(periodLabel, valueX, svgYToMm(PERIOD_LABEL_BASELINE_Y_SVG, pageH))
  } catch (err) {
    console.error('Contributions PDF template failed to load; using minimal header.', err)
    doc.setFillColor(TEMPLATE_BLUE_RGB[0], TEMPLATE_BLUE_RGB[1], TEMPLATE_BLUE_RGB[2])
    doc.rect(0, 0, pageW, TOP_BAR_MM, 'F')
    doc.setTextColor(17, 24, 39)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('Chama', marginLeft, TOP_BAR_MM + 8)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(17, 24, 39)
    doc.text('Contributions', marginLeft, TOP_BAR_MM + 16)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(107, 114, 128)
    doc.text(`Date:  ${formatExportDateLong(exportedAt)}`, marginLeft, TOP_BAR_MM + 24)
    doc.text(`For the period:  ${periodLabel}`, marginLeft, TOP_BAR_MM + 31)
  }

  const drawContinuationHeader = () => {
    doc.setFillColor(TEMPLATE_BLUE_RGB[0], TEMPLATE_BLUE_RGB[1], TEMPLATE_BLUE_RGB[2])
    doc.rect(0, 0, pageW, TOP_BAR_MM, 'F')
  }

  const total = rows.reduce((s, r) => s + r.amount, 0)
  const totalStr = total.toLocaleString('en-US')

  const w = tableWidth
  const colW = [w * 0.22, w * 0.14, w * 0.3, w * 0.18, w * 0.16] as const

  autoTable(doc, {
    startY,
    tableWidth: w,
    showHead: 'everyPage',
    margin: {
      left: marginLeft,
      right: marginRight,
      bottom: 22,
      top: TOP_BAR_MM + 4,
    },
    head: [['Transaction ID', 'Date', 'Name', 'Phone Number', 'Amount']],
    body: rows.map((r) => [
      r.transactionId,
      formatDateCell(r.date),
      r.name,
      r.phone,
      r.amount.toLocaleString('en-US'),
    ]),
    foot: [['', '', '', 'Total', totalStr]],
    showFoot: 'lastPage',
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 2.2,
      lineWidth: 0,
      lineColor: [255, 255, 255],
      textColor: [31, 41, 55],
      valign: 'middle',
    },
    headStyles: {
      fillColor: TEMPLATE_BLUE_RGB,
      textColor: 255,
      fontStyle: 'bold',
      lineWidth: 0,
      halign: 'left',
    },
    bodyStyles: {
      lineWidth: 0,
    },
    footStyles: {
      fillColor: [255, 255, 255],
      textColor: [17, 24, 39],
      fontStyle: 'bold',
      lineWidth: 0,
    },
    columnStyles: {
      0: { cellWidth: colW[0], halign: 'left' },
      1: { cellWidth: colW[1], halign: 'left' },
      2: { cellWidth: colW[2], halign: 'left' },
      3: { cellWidth: colW[3], halign: 'right' },
      4: { cellWidth: colW[4], halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section === 'head') {
        if (data.column.index === 3 || data.column.index === 4) {
          data.cell.styles.halign = 'right'
        }
      }
      if (data.section === 'body') {
        data.cell.styles.lineWidth = 0
        if (data.row.index % 2 === 1) {
          data.cell.styles.fillColor = [245, 245, 246]
        } else {
          data.cell.styles.fillColor = [255, 255, 255]
        }
        if (data.column.index === 3 || data.column.index === 4) {
          data.cell.styles.halign = 'right'
        }
      }
      if (data.section === 'foot') {
        data.cell.styles.fillColor = [255, 255, 255]
        data.cell.styles.lineWidth = 0
        if (data.column.index === 3 || data.column.index === 4) {
          data.cell.styles.halign = 'right'
        }
      }
    },
    willDrawPage: (data) => {
      if (data.pageNumber > 1) {
        drawContinuationHeader()
      }
    },
  })

  const stamp = formatExportStamp(exportedAt)
  const blob = doc.output('blob')
  downloadBlob(blob, `milestone-fraternity-contributions-${stamp}.pdf`)
}
