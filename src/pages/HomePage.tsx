import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx'
import * as XLSX from 'xlsx'
import { useAuth } from '../context/AuthContext'
import '../App.css'

type PaymentRow = {
  id: string
  date: string
  name: string
  phone: string
  amount: string
}

type DateRangeKey = '7' | '14' | '30' | '90'

const ALL_ROWS: PaymentRow[] = [
  {
    id: 'UCFBP9F3NO',
    date: '15/3/2026',
    name: 'Juma Yusuf',
    phone: '+254 722 123 456',
    amount: '15,000',
  },
  {
    id: 'UCFBP9F3NO',
    date: '12/3/2026',
    name: 'Michael Mathu',
    phone: '+254 722 123 456',
    amount: '24,600',
  },
  {
    id: 'UCFBP9F3NO',
    date: '11/3/2026',
    name: 'Joy Rono',
    phone: '+254 722 123 456',
    amount: '12,000',
  },
  {
    id: 'UCFBP9F3NO',
    date: '10/3/2026',
    name: 'Eric Kantai',
    phone: '+254 722 123 456',
    amount: '84,300',
  },
  {
    id: 'UCFBP9F3NO',
    date: '9/3/2026',
    name: 'Mary Wambui',
    phone: '+254 722 123 456',
    amount: '16,500',
  },
  {
    id: 'UCFBP9F3NO',
    date: '8/3/2026',
    name: 'Brian Otieno',
    phone: '+254 722 123 456',
    amount: '9,800',
  },
  {
    id: 'UCFBP9F3NO',
    date: '7/3/2026',
    name: 'Sarah Njeri',
    phone: '+254 722 123 456',
    amount: '11,200',
  },
  {
    id: 'UCFBP9F3NO',
    date: '6/3/2026',
    name: 'Bashir Suleiman',
    phone: '+254 722 123 456',
    amount: '7,450',
  },
  {
    id: 'UCFBP9F3NO',
    date: '5/3/2026',
    name: 'Lucy Wanjiru',
    phone: '+254 722 123 456',
    amount: '18,900',
  },
  {
    id: 'UCFBP9F3NO',
    date: '4/3/2026',
    name: 'Peter Kariuki',
    phone: '+254 722 123 456',
    amount: '6,750',
  },
  {
    id: 'UCFBP9F3NO',
    date: '3/3/2026',
    name: 'Ann Chebet',
    phone: '+254 722 123 456',
    amount: '13,400',
  },
  {
    id: 'UCFBP9F3NO',
    date: '2/3/2026',
    name: 'George Ouma',
    phone: '+254 722 123 456',
    amount: '5,600',
  },
  {
    id: 'UCFBP9F3NO',
    date: '1/3/2026',
    name: 'Grace Wairimu',
    phone: '+254 722 123 456',
    amount: '10,300',
  },
  {
    id: 'UCFBP9F3NO',
    date: '29/2/2026',
    name: 'Samuel Kibet',
    phone: '+254 722 123 456',
    amount: '8,150',
  },
  // extra rows between ~90 and 3 days ago
  {
    id: 'UCFBP9F3NO',
    date: '28/2/2026',
    name: 'Lilian Achieng',
    phone: '+254 722 123 456',
    amount: '9,200',
  },
  {
    id: 'UCFBP9F3NO',
    date: '26/2/2026',
    name: 'Anthony Kamau',
    phone: '+254 722 123 456',
    amount: '7,900',
  },
  {
    id: 'UCFBP9F3NO',
    date: '23/2/2026',
    name: 'Caroline Wanja',
    phone: '+254 722 123 456',
    amount: '14,300',
  },
  {
    id: 'UCFBP9F3NO',
    date: '20/2/2026',
    name: 'Felix Mutua',
    phone: '+254 722 123 456',
    amount: '6,800',
  },
  {
    id: 'UCFBP9F3NO',
    date: '18/2/2026',
    name: 'Janet Naliaka',
    phone: '+254 722 123 456',
    amount: '12,750',
  },
  {
    id: 'UCFBP9F3NO',
    date: '15/2/2026',
    name: 'Patrick Obiero',
    phone: '+254 722 123 456',
    amount: '10,900',
  },
  {
    id: 'UCFBP9F3NO',
    date: '12/2/2026',
    name: 'Naomi Chepkemoi',
    phone: '+254 722 123 456',
    amount: '8,600',
  },
  {
    id: 'UCFBP9F3NO',
    date: '9/2/2026',
    name: 'Collins Barasa',
    phone: '+254 722 123 456',
    amount: '9,950',
  },
  {
    id: 'UCFBP9F3NO',
    date: '6/2/2026',
    name: 'Winnie Aoko',
    phone: '+254 722 123 456',
    amount: '7,300',
  },
  {
    id: 'UCFBP9F3NO',
    date: '3/2/2026',
    name: 'Joseph Muli',
    phone: '+254 722 123 456',
    amount: '11,450',
  },
  {
    id: 'UCFBP9F3NO',
    date: '31/1/2026',
    name: 'Agnes Naliaka',
    phone: '+254 722 123 456',
    amount: '6,200',
  },
  {
    id: 'UCFBP9F3NO',
    date: '28/1/2026',
    name: 'Kevin Kiprotich',
    phone: '+254 722 123 456',
    amount: '10,050',
  },
  {
    id: 'UCFBP9F3NO',
    date: '25/1/2026',
    name: 'Ruth Cherono',
    phone: '+254 722 123 456',
    amount: '9,700',
  },
  {
    id: 'UCFBP9F3NO',
    date: '22/1/2026',
    name: 'Martin Ndegwa',
    phone: '+254 722 123 456',
    amount: '8,250',
  },
  {
    id: 'UCFBP9F3NO',
    date: '19/1/2026',
    name: 'Stella Achieng',
    phone: '+254 722 123 456',
    amount: '7,950',
  },
  {
    id: 'UCFBP9F3NO',
    date: '16/1/2026',
    name: 'Ibrahim Yusuf',
    phone: '+254 722 123 456',
    amount: '6,400',
  },
  {
    id: 'UCFBP9F3NO',
    date: '13/1/2026',
    name: 'Beatrice Kendi',
    phone: '+254 722 123 456',
    amount: '9,150',
  },
  {
    id: 'UCFBP9F3NO',
    date: '10/1/2026',
    name: 'Nicholas Kariuki',
    phone: '+254 722 123 456',
    amount: '8,050',
  },
  {
    id: 'UCFBP9F3NO',
    date: '7/1/2026',
    name: 'Sharon Wanjala',
    phone: '+254 722 123 456',
    amount: '7,100',
  },
  {
    id: 'UCFBP9F3NO',
    date: '5/1/2026',
    name: 'Abdi Farah',
    phone: '+254 722 123 456',
    amount: '6,900',
  },
]

function parseDate(d: string): Date {
  const [day, month, year] = d.split('/').map((part) => parseInt(part, 10))
  return new Date(year, month - 1, day)
}

function parseAmount(a: string): number {
  return Number(a.replace(/,/g, ''))
}

function formatAmount(n: number): string {
  return n.toLocaleString('en-KE')
}

function getRangeLabel(range: DateRangeKey): string {
  if (range === '7') return 'Last 7 days'
  if (range === '14') return 'Last 14 days'
  if (range === '30') return 'Last 1 month'
  return 'Last 3 months'
}

function buildCsv(rows: PaymentRow[], rangeLabel: string): string {
  const header = ['Transaction ID', 'Date', 'Name', 'Phone Number', 'Amount']
  const titleLine = 'Milestone Fraternity'
  const periodLine = rangeLabel
  const body = rows.map((r) =>
    [r.id, r.date, r.name, r.phone, r.amount].map((cell) => `"${cell}"`).join(','),
  )
  return [titleLine, periodLine, '', header.join(','), ...body].join('\r\n')
}

function buildXlsxBlob(rows: PaymentRow[], rangeLabel: string): Blob {
  const header = ['Transaction ID', 'Date', 'Name', 'Phone Number', 'Amount']
  const body = rows.map((r) => [r.id, r.date, r.name, r.phone, parseAmount(r.amount)])
  const total = rows.reduce((sum, row) => sum + parseAmount(row.amount), 0)
  const sheetRows = [
    ['Milestone Fraternity'],
    [rangeLabel],
    [],
    header,
    ...body,
    [],
    ['', '', '', 'Total', total],
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(sheetRows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments')
  const workbookBytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([workbookBytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

async function buildDocxBlob(rows: PaymentRow[], rangeLabel: string): Promise<Blob> {
  const header = ['Transaction ID', 'Date', 'Name', 'Phone Number', 'Amount']
  const total = formatAmount(rows.reduce((sum, row) => sum + parseAmount(row.amount), 0))

  const headerRow = new TableRow({
    children: header.map(
      (cell) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: cell, bold: true })] })],
        }),
    ),
  })

  const bodyRows = rows.map(
    (row) =>
      new TableRow({
        children: [row.id, row.date, row.name, row.phone, row.amount].map(
          (cell) =>
            new TableCell({
              children: [new Paragraph(String(cell))],
            }),
        ),
      }),
  )

  const totalRow = new TableRow({
    children: [
      new TableCell({ children: [new Paragraph('')] }),
      new TableCell({ children: [new Paragraph('')] }),
      new TableCell({ children: [new Paragraph('')] }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Total', bold: true })] })],
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: total, bold: true })] })],
      }),
    ],
  })

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: 'Milestone Fraternity' }),
          new Paragraph({ text: rangeLabel }),
          new Paragraph({ text: '' }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...bodyRows, totalRow],
          }),
        ],
      },
    ],
  })

  return Packer.toBlob(doc)
}

function buildPdf(rows: PaymentRow[], rangeLabel: string) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  })

  doc.setFontSize(16)
  doc.text('Milestone Fraternity', 40, 40)

  doc.setFontSize(11)
  doc.text(rangeLabel, 40, 60)

  const head = [['Transaction ID', 'Date', 'Name', 'Phone Number', 'Amount']]
  const body = rows.map((r) => [r.id, r.date, r.name, r.phone, r.amount])

  autoTable(doc, {
    startY: 80,
    head,
    body,
    styles: {
      fontSize: 10,
    },
    headStyles: {
      fillColor: [32, 112, 210],
      textColor: 255,
    },
    footStyles: {
      fillColor: [245, 245, 245],
    },
    didDrawPage: (data) => {
      const total = formatAmount(rows.reduce((sum, row) => sum + parseAmount(row.amount), 0))
      const pageWidth = doc.internal.pageSize.getWidth()
      const xLabel = pageWidth - 200
      const xValue = pageWidth - 80
      const y = (data.cursor?.y ?? 80) + 24
      doc.setFontSize(11)
      doc.text('Total', xLabel, y, { align: 'right' })
      doc.text(total, xValue, y, { align: 'right' })
    },
  })

  return doc
}

function download(text: string, filename: string, mime: string) {
  const blob = new Blob([text], { type: mime })
  downloadBlob(blob, filename)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function HomePage() {
  const navigate = useNavigate()
  const { displayName, logout } = useAuth()
  const [range, setRange] = useState<DateRangeKey>('7')

  const rows = useMemo(() => {
    const today = new Date()
    const days = range === '7' ? 7 : range === '14' ? 14 : range === '30' ? 30 : 90
    const msPerDay = 1000 * 60 * 60 * 24

    return ALL_ROWS.filter((row) => {
      const rd = parseDate(row.date)
      const diffDays = (today.getTime() - rd.getTime()) / msPerDay
      return diffDays >= 0 && diffDays <= days
    }).sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime())
  }, [range])

  const total = useMemo(
    () => formatAmount(rows.reduce((sum, row) => sum + parseAmount(row.amount), 0)),
    [rows],
  )

  const handleExport = async (type: 'csv' | 'xls' | 'doc' | 'pdf') => {
    const rangeLabel = getRangeLabel(range)
    const csv = buildCsv(rows, rangeLabel)
    const xlsxBlob = buildXlsxBlob(rows, rangeLabel)
    const timestamp = new Date().toISOString().slice(0, 10)
    if (type === 'csv') {
      download(csv, `received-payments-${timestamp}.csv`, 'text/csv;charset=utf-8;')
    } else if (type === 'xls') {
      downloadBlob(xlsxBlob, `received-payments-${timestamp}.xlsx`)
    } else if (type === 'doc') {
      const docxBlob = await buildDocxBlob(rows, rangeLabel)
      downloadBlob(docxBlob, `received-payments-${timestamp}.docx`)
    } else {
      const doc = buildPdf(rows, rangeLabel)
      doc.save(`received-payments-${timestamp}.pdf`)
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbarInner">
          <div className="brand">
            <div className="brandTitle">Milestone Fraternity</div>
            <div className="brandMeta">
              <span className="pill pillGreen">Paybill: 24798</span>
              <span className="pill pillGreen">Account: MSL</span>
            </div>
          </div>

          <div className="profile">
            <div className="avatar" aria-hidden="true">
              <img
                className="avatarIcon"
                src={new URL('../assets/icons/User.svg', import.meta.url).toString()}
                alt=""
              />
            </div>
            <div className="profileText">
              <div className="profileName">{displayName}</div>
              <div className="profileRole">Treasurer</div>
              <button
                className="logout"
                type="button"
                onClick={() => {
                  logout()
                  navigate('/login', { replace: true })
                }}
              >
                <img
                  className="logoutIcon"
                  src={new URL('../assets/icons/Log out.svg', import.meta.url).toString()}
                  alt=""
                />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="divider" />

      <main className="content">
        <section className="sectionHeader">
          <h1 className="sectionTitle">Received Payments</h1>

          <div className="controls">
            <button className="iconButton" type="button" aria-label="Filter">
              <img
                className="iconButtonIcon"
                src={new URL('../assets/icons/Filter Icon.svg', import.meta.url).toString()}
                alt=""
              />
            </button>

            <div className="segmented" role="tablist" aria-label="Date range">
              <button
                className={`seg ${range === '7' ? 'segActive' : ''}`}
                type="button"
                role="tab"
                onClick={() => setRange('7')}
              >
                7 days
              </button>
              <button
                className={`seg ${range === '14' ? 'segActive' : ''}`}
                type="button"
                role="tab"
                onClick={() => setRange('14')}
              >
                14 days
              </button>
              <button
                className={`seg ${range === '30' ? 'segActive' : ''}`}
                type="button"
                role="tab"
                onClick={() => setRange('30')}
              >
                1 month
              </button>
              <button
                className={`seg ${range === '90' ? 'segActive' : ''}`}
                type="button"
                role="tab"
                onClick={() => setRange('90')}
              >
                3 months
              </button>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="tableScroll" role="region" aria-label="Received payments table">
            <table className="table">
              <thead>
                <tr className="theadRow">
                  <th>Transaction ID</th>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Phone Number</th>
                  <th className="cellRight">Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={`${r.id}-${idx}`} className="tbodyRow">
                    <td>{r.id}</td>
                    <td>{r.date}</td>
                    <td>{r.name}</td>
                    <td>{r.phone}</td>
                    <td className="cellRight">{r.amount}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="tfootRow">
                  <td />
                  <td />
                  <td />
                  <td className="cellRight totalLabel">Total</td>
                  <td className="cellRight totalAmount">{total}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <section className="exportRow">
          <button
            className="exportButton"
            type="button"
            onClick={() => handleExport('csv')}
          >
            <img
              className="exportIcon"
              src={new URL('../assets/icons/Export.svg', import.meta.url).toString()}
              alt=""
            />
            <span>Export</span>
          </button>

          <div className="exportFormats" aria-label="Export formats">
            <button
              className="formatButton"
              type="button"
              aria-label="Export XLS"
              onClick={() => handleExport('xls')}
            >
              <img
                className="formatIcon"
                src={new URL('../assets/icons/Doc.svg', import.meta.url).toString()}
                alt=""
              />
            </button>
            <button
              className="formatButton"
              type="button"
              aria-label="Export CSV"
              onClick={() => handleExport('csv')}
            >
              <img
                className="formatIcon"
                src={new URL('../assets/icons/CSV.svg', import.meta.url).toString()}
                alt=""
              />
            </button>
            <button
              className="formatButton"
              type="button"
              aria-label="Export DOC"
              onClick={() => handleExport('doc')}
            >
              <img
                className="formatIcon"
                src={new URL('../assets/icons/XLS.svg', import.meta.url).toString()}
                alt=""
              />
            </button>
            <button
              className="formatButton"
              type="button"
              aria-label="Export PDF"
              onClick={() => handleExport('pdf')}
            >
              <img
                className="formatIcon"
                src={new URL('../assets/icons/PDF.svg', import.meta.url).toString()}
                alt=""
              />
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
