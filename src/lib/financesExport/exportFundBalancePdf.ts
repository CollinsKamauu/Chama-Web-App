import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getChamaOrganizationName } from '../chamaOrganizationName'
import { downloadBlob, formatExportDateLong, formatExportStamp } from '../contributionsExport/download'
import { rasterizeSvgFromUrl } from '../contributionsExport/rasterizeSvg'

/** Matches `public/export-templates/balance-fund-statement-template.svg`. */
const TEMPLATE_BLUE_RGB: [number, number, number] = [32, 112, 210]

const TEMPLATE_W = 2480.315
const TEMPLATE_H = 3507.874

/** Table band — aligned with contributions template 4 layout on the same artboard. */
const TABLE_START_Y_SVG = 948
const TABLE_PAD_BELOW_RULE_SVG = 14

const TABLE_LEFT_SVG = 217.442
const TABLE_WIDTH_SVG = 2064.857

/** Values align with template label columns (same as contributions template 4). */
const DATE_VALUE_X_SVG = 720
const DATE_LABEL_BASELINE_Y_SVG = 382.707198 + 404.041
const PERIOD_LABEL_BASELINE_Y_SVG = 462.284555 + 404.041

const TOP_BAR_MM = 5

const DISCLAIMER_BLOCK = `Disclaimer: This is not an official financial statement.

For audited records and official account balances, please refer to your monthly M-Pesa statement or the M-Pesa Business Portal.`

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

export type FundBalancePdfInput = {
  totalIncome: number
  totalExpenses: number
  netBalance: number
  periodLabel: string
  exportedAt: Date
}

export async function buildFundBalancePdfBlob(data: FundBalancePdfInput): Promise<Blob> {
  const { totalIncome, totalExpenses, netBalance, periodLabel, exportedAt } = data
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  const marginLeft = svgDxToMm(TABLE_LEFT_SVG, pageW)
  const tableWidth = svgDxToMm(TABLE_WIDTH_SVG, pageW)
  const marginRight = pageW - marginLeft - tableWidth

  const startY = svgYToMm(TABLE_START_Y_SVG + TABLE_PAD_BELOW_RULE_SVG, pageH)

  const origin = window.location.origin
  const templateUrl = `${origin}/export-templates/balance-fund-statement-template.svg`

  try {
    const templatePng = await rasterizeSvgFromUrl(templateUrl, Math.round(TEMPLATE_W), Math.round(TEMPLATE_H))
    doc.addImage(uint8ToDataUrlPng(templatePng), 'PNG', 0, 0, pageW, pageH)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(107, 107, 107)
    const valueX = svgDxToMm(DATE_VALUE_X_SVG, pageW)
    doc.text(formatExportDateLong(exportedAt), valueX, svgYToMm(DATE_LABEL_BASELINE_Y_SVG, pageH))
    doc.text(periodLabel, valueX, svgYToMm(PERIOD_LABEL_BASELINE_Y_SVG, pageH))
  } catch (err) {
    console.error('Fund balance PDF template failed to load; using minimal header.', err)
    doc.setFillColor(TEMPLATE_BLUE_RGB[0], TEMPLATE_BLUE_RGB[1], TEMPLATE_BLUE_RGB[2])
    doc.rect(0, 0, pageW, TOP_BAR_MM, 'F')
    doc.setTextColor(17, 24, 39)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(getChamaOrganizationName(), marginLeft, TOP_BAR_MM + 8)
    doc.setFontSize(12)
    doc.text('Fund Balance', marginLeft, TOP_BAR_MM + 16)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text(`Date: ${formatExportDateLong(exportedAt)}`, marginLeft, TOP_BAR_MM + 24)
    doc.text(`Period: ${periodLabel}`, marginLeft, TOP_BAR_MM + 31)
  }

  const incomeStr = totalIncome.toLocaleString('en-US')
  const expStr = `-${totalExpenses.toLocaleString('en-US')}`
  const balanceStr = `KES ${netBalance.toLocaleString('en-US')}`

  autoTable(doc, {
    startY,
    tableWidth,
    margin: {
      left: marginLeft,
      right: marginRight,
      bottom: 32,
      top: TOP_BAR_MM + 4,
    },
    head: [['Description', 'Amount']],
    body: [
      ['Contributions', incomeStr],
      ['Expenditure', expStr],
    ],
    foot: [['Balance', balanceStr]],
    showFoot: 'lastPage',
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 2.8,
      lineWidth: 0,
      lineColor: [229, 231, 235],
      textColor: [17, 24, 39],
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
      lineWidth: { top: 0.4, bottom: 0.4, left: 0, right: 0 },
      lineColor: [17, 24, 39],
    },
    columnStyles: {
      0: { cellWidth: tableWidth * 0.58, halign: 'left' },
      1: { cellWidth: tableWidth * 0.42, halign: 'right' },
    },
    didParseCell: (cellData) => {
      if (cellData.section === 'head' && cellData.column.index === 1) {
        cellData.cell.styles.halign = 'right'
      }
      if (cellData.section === 'body') {
        cellData.cell.styles.fillColor = cellData.row.index % 2 === 1 ? [249, 250, 251] : [255, 255, 255]
      }
      if (cellData.section === 'foot') {
        cellData.cell.styles.halign = cellData.column.index === 0 ? 'left' : 'right'
      }
    },
  })

  const lastTable = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable
  const tableEndY = lastTable?.finalY ?? startY + 24

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  const discLines = doc.splitTextToSize(DISCLAIMER_BLOCK, tableWidth)
  doc.text(discLines, marginLeft, tableEndY + 6, {
    lineHeightFactor: 1.35,
    maxWidth: tableWidth,
  })

  return doc.output('blob')
}

export async function exportFundBalancePdf(data: FundBalancePdfInput): Promise<void> {
  const blob = await buildFundBalancePdfBlob(data)
  const stamp = formatExportStamp(data.exportedAt)
  downloadBlob(blob, `milestone-fraternity-fund-balance-${stamp}.pdf`)
}
