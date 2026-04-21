import {
  AlignmentType,
  Document,
  HeightRule,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import type { ContributionRow } from '../../hooks/useContributionsData'
import { getChamaOrganizationName } from '../chamaOrganizationName'
import { downloadBlob, formatExportDateLong, formatExportStamp } from './download'

const BLUE = '2070D2'
const LABEL_GRAY = '6B7280'
const TITLE_GRAY = '111827'

/** Cell padding (DXA) — tight for narrow / mobile Word layouts. */
const DATA_CELL_MARGIN = {
  marginUnitType: WidthType.DXA,
  top: 120,
  bottom: 120,
  left: 60,
  right: 60,
} as const

/** ~6.5" content width in twips; proportional cols reflow with AUTOFIT. */
const COLUMN_WIDTHS_TWIPS = [2000, 980, 2860, 1820, 1700] as const

/** Narrower side margins (twips) so the table has more horizontal room on small screens. */
const PAGE_MARGIN_NARROW = { top: 1440, right: 720, bottom: 1440, left: 720 } as const

export async function exportContributionsDocx(
  rows: ContributionRow[],
  periodLabel: string,
  exportedAt: Date,
): Promise<void> {
  const total = rows.reduce((s, r) => s + r.amount, 0)

  const docHeaderParagraphs: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: getChamaOrganizationName(),
          bold: true,
          size: 36,
          font: 'Arial',
          color: TITLE_GRAY,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Chama Contributions', bold: true, size: 28, font: 'Arial', color: TITLE_GRAY }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Date:  ', color: LABEL_GRAY, size: 24, font: 'Arial' }),
        new TextRun({ text: formatExportDateLong(exportedAt), color: LABEL_GRAY, size: 24, font: 'Arial' }),
      ],
    }),
    new Paragraph({
      spacing: { after: 360 },
      children: [
        new TextRun({ text: 'For the period:  ', color: LABEL_GRAY, size: 24, font: 'Arial' }),
        new TextRun({ text: periodLabel, color: LABEL_GRAY, size: 24, font: 'Arial' }),
      ],
    }),
    new Paragraph({ text: '' }),
  ]

  const headerRow = new TableRow({
    tableHeader: true,
    height: { value: 340, rule: HeightRule.ATLEAST },
    children: ['Transaction ID', 'Date', 'Name', 'Phone Number', 'Amount'].map(
      (h) =>
        new TableCell({
          shading: { fill: BLUE, type: ShadingType.CLEAR },
          margins: DATA_CELL_MARGIN,
          verticalAlign: 'center',
          children: [
            new Paragraph({
              children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 20, font: 'Arial' })],
            }),
          ],
        }),
    ),
  })

  const bodyRows = rows.map(
    (r) =>
      new TableRow({
        height: { value: 300, rule: HeightRule.ATLEAST },
        children: [
          new TableCell({
            margins: DATA_CELL_MARGIN,
            verticalAlign: 'center',
            children: [new Paragraph({ children: [new TextRun({ text: r.transactionId, font: 'Arial', size: 20 })] })],
          }),
          new TableCell({
            margins: DATA_CELL_MARGIN,
            verticalAlign: 'center',
            children: [new Paragraph({ children: [new TextRun({ text: r.date, font: 'Arial', size: 20 })] })],
          }),
          new TableCell({
            margins: DATA_CELL_MARGIN,
            verticalAlign: 'center',
            children: [new Paragraph({ children: [new TextRun({ text: r.name, font: 'Arial', size: 20 })] })],
          }),
          new TableCell({
            margins: DATA_CELL_MARGIN,
            verticalAlign: 'center',
            children: [new Paragraph({ children: [new TextRun({ text: r.phone, font: 'Arial', size: 20 })] })],
          }),
          new TableCell({
            margins: DATA_CELL_MARGIN,
            verticalAlign: 'center',
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: r.amount.toLocaleString('en-US'), font: 'Arial', size: 20 })],
              }),
            ],
          }),
        ],
      }),
  )

  const footRow = new TableRow({
    height: { value: 340, rule: HeightRule.ATLEAST },
    children: [
      new TableCell({
        columnSpan: 4,
        margins: DATA_CELL_MARGIN,
        verticalAlign: 'center',
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: 'Total', bold: true, font: 'Arial', size: 22 })],
          }),
        ],
      }),
      new TableCell({
        margins: DATA_CELL_MARGIN,
        verticalAlign: 'center',
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: total.toLocaleString('en-US'), bold: true, font: 'Arial', size: 22 })],
          }),
        ],
      }),
    ],
  })

  const dataTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.AUTOFIT,
    columnWidths: [...COLUMN_WIDTHS_TWIPS],
    rows: [headerRow, ...bodyRows, footRow],
  })

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: PAGE_MARGIN_NARROW,
          },
        },
        children: [...docHeaderParagraphs, dataTable],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, `milestone-fraternity-contributions-${formatExportStamp(exportedAt)}.docx`)
}
