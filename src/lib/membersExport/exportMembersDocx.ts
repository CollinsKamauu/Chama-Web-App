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
import type { MemberRow } from '../../types/members'
import { downloadBlob, formatExportDateLong, formatExportStamp } from '../contributionsExport/download'

const BLUE = '2070D2'
const LABEL_GRAY = '6B7280'
const TITLE_GRAY = '111827'

const DATA_CELL_MARGIN = {
  marginUnitType: WidthType.DXA,
  top: 120,
  bottom: 120,
  left: 60,
  right: 60,
} as const

const COLUMN_WIDTHS_TWIPS = [2860, 2400, 2200, 1920] as const
const PAGE_MARGIN_NARROW = { top: 1440, right: 720, bottom: 1440, left: 720 } as const

export async function exportMembersDocx(rows: MemberRow[], exportedAt: Date): Promise<void> {
  const docHeaderParagraphs: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({ text: 'Milestone Fraternity', bold: true, size: 36, font: 'Arial', color: TITLE_GRAY }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Chama Members', bold: true, size: 28, font: 'Arial', color: TITLE_GRAY }),
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
        new TextRun({ text: 'Total Registered Members:  ', color: LABEL_GRAY, size: 24, font: 'Arial' }),
        new TextRun({
          text: rows.length.toLocaleString('en-US'),
          color: LABEL_GRAY,
          size: 24,
          font: 'Arial',
        }),
      ],
    }),
    new Paragraph({ text: '' }),
  ]

  const headerRow = new TableRow({
    tableHeader: true,
    height: { value: 340, rule: HeightRule.ATLEAST },
    children: ['Name', 'Phone Number', 'Role', 'Contributions'].map(
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
            children: [new Paragraph({ children: [new TextRun({ text: r.role, font: 'Arial', size: 20 })] })],
          }),
          new TableCell({
            margins: DATA_CELL_MARGIN,
            verticalAlign: 'center',
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: r.contributions.toLocaleString('en-US'), font: 'Arial', size: 20 }),
                ],
              }),
            ],
          }),
        ],
      }),
  )

  const dataTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.AUTOFIT,
    columnWidths: [...COLUMN_WIDTHS_TWIPS],
    rows: [headerRow, ...bodyRows],
  })

  const doc = new Document({
    sections: [
      {
        properties: { page: { margin: PAGE_MARGIN_NARROW } },
        children: [...docHeaderParagraphs, dataTable],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, `milestone-fraternity-members-${formatExportStamp(exportedAt)}.docx`)
}
