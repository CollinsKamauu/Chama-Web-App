import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TableLayoutType,
  TextRun,
  WidthType,
} from 'docx'
import * as XLSX from 'xlsx'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
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

function formatDownloadedAt(d: Date): string {
  // Kenyan formatting, keep time in 24h.
  try {
    return d.toLocaleString('en-KE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return d.toISOString()
  }
}

function buildCsv(rows: PaymentRow[], rangeLabel: string, modeLabel: string, downloadedAt: string): string {
  const header = ['Transaction ID', 'Date', 'Name', 'Phone Number', 'Amount']
  const titleLine = 'Milestone Fraternity'
  const periodLine = rangeLabel
  const modeLine = `Mode: ${modeLabel}`
  const downloadedAtLine = `Downloaded: ${downloadedAt}`
  const body = rows.map((r) =>
    [r.id, r.date, r.name, r.phone, r.amount].map((cell) => `"${cell}"`).join(','),
  )
  return [titleLine, periodLine, modeLine, downloadedAtLine, '', header.join(','), ...body].join('\r\n')
}

function buildXlsxBlob(rows: PaymentRow[], rangeLabel: string, modeLabel: string, downloadedAt: string): Blob {
  const header = ['Transaction ID', 'Date', 'Name', 'Phone Number', 'Amount']
  const body = rows.map((r) => [r.id, r.date, r.name, r.phone, parseAmount(r.amount)])
  const total = rows.reduce((sum, row) => sum + parseAmount(row.amount), 0)
  const sheetRows = [
    ['Milestone Fraternity'],
    [rangeLabel],
    [`Mode: ${modeLabel}`],
    [`Downloaded: ${downloadedAt}`],
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

/** Twips (1/20 pt) for tblGrid — docx defaults to 100 twips/column otherwise (~2 mm), which breaks mobile viewers. */
const DOCX_COL_WIDTHS_TWIPS = [2600, 1100, 2300, 2000, 1200] as const

function docxTableCell(text: string, bold = false): TableCell {
  return new TableCell({
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [
      bold
        ? new Paragraph({ children: [new TextRun({ text, bold: true })] })
        : new Paragraph(String(text)),
    ],
  })
}

async function buildDocxBlob(
  rows: PaymentRow[],
  rangeLabel: string,
  modeLabel: string,
  downloadedAt: string,
): Promise<Blob> {
  const header = ['Transaction ID', 'Date', 'Name', 'Phone Number', 'Amount']
  const total = formatAmount(rows.reduce((sum, row) => sum + parseAmount(row.amount), 0))

  const headerRow = new TableRow({
    tableHeader: true,
    children: header.map((cell) => docxTableCell(cell, true)),
  })

  const bodyRows = rows.map(
    (row) =>
      new TableRow({
        children: [row.id, row.date, row.name, row.phone, row.amount].map((cell) =>
          docxTableCell(String(cell)),
        ),
      }),
  )

  const totalRow = new TableRow({
    children: [
      docxTableCell(''),
      docxTableCell(''),
      docxTableCell(''),
      docxTableCell('Total', true),
      docxTableCell(total, true),
    ],
  })

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, right: 1080, bottom: 1134, left: 1080 },
          },
        },
        children: [
          new Paragraph({ text: 'Milestone Fraternity' }),
          new Paragraph({ text: rangeLabel }),
          new Paragraph({ text: `Mode: ${modeLabel}` }),
          new Paragraph({ text: `Downloaded: ${downloadedAt}` }),
          new Paragraph({ text: '' }),
          new Table({
            columnWidths: [...DOCX_COL_WIDTHS_TWIPS],
            layout: TableLayoutType.FIXED,
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...bodyRows, totalRow],
          }),
        ],
      },
    ],
  })

  return Packer.toBlob(doc)
}

function buildPdf(rows: PaymentRow[], rangeLabel: string, modeLabel: string, downloadedAt: string) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  })

  doc.setFontSize(16)
  doc.text('Milestone Fraternity', 40, 40)

  doc.setFontSize(11)
  doc.text(rangeLabel, 40, 60)
  doc.text(`Mode: ${modeLabel}`, 40, 75)
  doc.text(`Downloaded: ${downloadedAt}`, 40, 90)

  const head = [['Transaction ID', 'Date', 'Name', 'Phone Number', 'Amount']]
  const body = rows.map((r) => [r.id, r.date, r.name, r.phone, r.amount])

  autoTable(doc, {
    startY: 110,
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
  const [transactions, setTransactions] = useState<unknown[]>([])
  const [liveDemoEnabled, setLiveDemoEnabled] = useState(false)
  const [liveDemoRows, setLiveDemoRows] = useState<PaymentRow[]>([])
  const liveDemoCounterRef = useRef(1)

  function normalizeToDdMmYyyy(value: unknown): string | null {
    if (typeof value === 'string') {
      // 1) dd/mm/yyyy
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) return value

      // 2) ISO or RFC date strings
      const asDate = new Date(value)
      if (!isNaN(asDate.getTime())) {
        const day = String(asDate.getDate()).padStart(2, '0')
        const month = String(asDate.getMonth() + 1).padStart(2, '0')
        const year = asDate.getFullYear()
        return `${day}/${month}/${year}`
      }
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      const asDate = new Date(value)
      if (!isNaN(asDate.getTime())) {
        const day = String(asDate.getDate()).padStart(2, '0')
        const month = String(asDate.getMonth() + 1).padStart(2, '0')
        const year = asDate.getFullYear()
        return `${day}/${month}/${year}`
      }
    }

    return null
  }

  function normalizeAmountToDisplay(value: unknown): string | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return formatAmount(value)
    }

    if (typeof value === 'string') {
      const cleaned = value.replace(/,/g, '').trim()
      const n = Number(cleaned)
      if (Number.isFinite(n)) return formatAmount(n)
      // If it already looks like a formatted amount, keep it.
      if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(value)) return value
    }

    return null
  }

  function normalizePaymentRow(raw: unknown, idx: number): PaymentRow | null {
    if (!raw || typeof raw !== 'object') return null
    const obj = raw as Record<string, unknown>

    const id =
      (typeof obj.id === 'string' && obj.id) ||
      (typeof obj.transactionId === 'string' && obj.transactionId) ||
      (typeof obj.transId === 'string' && obj.transId) ||
      (typeof obj.TransID === 'string' && obj.TransID) ||
      `tx-${idx}`

    const dateRaw =
      obj.date ?? obj.transactionDate ?? obj.createdAt ?? obj.timestamp ?? obj.TransTime ?? obj.transaction_time
    const date = normalizeToDdMmYyyy(dateRaw)
    if (!date) return null

    const name =
      (typeof obj.name === 'string' && obj.name) ||
      (typeof obj.customerName === 'string' && obj.customerName) ||
      (typeof obj.fullName === 'string' && obj.fullName) ||
      'Member'

    const phone =
      (typeof obj.phone === 'string' && obj.phone) ||
      (typeof obj.msisdn === 'string' && obj.msisdn) ||
      (typeof obj.MSISDN === 'string' && obj.MSISDN) ||
      ''

    const amountRaw =
      obj.amount ??
      obj.receivedAmount ??
      obj.amountReceived ??
      obj.transactionAmount ??
      obj.TransAmount ??
      obj.transAmount
    const amount = normalizeAmountToDisplay(amountRaw)
    if (!amount) return null

    return { id, date, name, phone, amount }
  }

  function looksLikeC2B(raw: unknown): boolean {
    if (!raw || typeof raw !== 'object') return false
    const obj = raw as Record<string, unknown>
    return (
      'TransID' in obj ||
      'transId' in obj ||
      'BillRefNumber' in obj ||
      'billRefNumber' in obj ||
      'MSISDN' in obj ||
      'msisdn' in obj
    )
  }

  useEffect(() => {
  const fetchData = async () => {
    const token = localStorage.getItem('chama_token')
    if (!token) {
      if (!import.meta.env.DEV) navigate('/login', { replace: true })
      return
    }
    const data = await api.get<unknown[]>('/api/transactions', token)
    if (data.success && Array.isArray(data.data)) {
      setTransactions(data.data)
    }
  }
  void fetchData()
  const intervalId = window.setInterval(() => { void fetchData() }, 5000)
  return () => window.clearInterval(intervalId)
}, [navigate])

  const generateLiveDemoPayment = (seq: number): PaymentRow => {
    const names = [
      'Juma Yusuf',
      'Michael Mathu',
      'Joy Rono',
      'Eric Kantai',
      'Mary Wambui',
      'Brian Otieno',
      'Sarah Njeri',
      'Bashir Suleiman',
      'Lucy Wanjiru',
      'Peter Kariuki',
      'Ann Chebet',
      'George Ouma',
      'Grace Wairimu',
      'Samuel Kibet',
      'Felix Mutua',
    ]

    const now = Date.now()
    // Spread across the last 90 days so the duration filters show results.
    const daysAgo = seq % 90
    const date = new Date(now - daysAgo * 24 * 60 * 60 * 1000 - (seq % 12) * 60 * 60 * 1000)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const ddmmyyyy = `${day}/${month}/${year}`

    const txId = `demo-${now}-${seq}`

    // Unique phone per sequence (keeps +2547XXXXXXXX format)
    const base = 20000000
    const phoneSuffix = String((base + seq) % 100000000).padStart(8, '0')
    const phone = `+2547${phoneSuffix}`

    const name = names[seq % names.length] ?? 'Member'

    const amountNumber = 500 + ((seq * 137) % 24500)
    const amount = amountNumber.toLocaleString('en-KE')

    return { id: txId, date: ddmmyyyy, name, phone, amount }
  }

  useEffect(() => {
    if (!liveDemoEnabled) {
      setLiveDemoRows([])
      return
    }

    // Seed with a few entries so the table isn't empty immediately.
    const seedSeq = liveDemoCounterRef.current
    const initial = [0, 1, 2, 3, 4].map((i) => generateLiveDemoPayment(seedSeq + i))
    liveDemoCounterRef.current = seedSeq + initial.length
    setLiveDemoRows(initial)

    const intervalId = window.setInterval(() => {
      const seq = liveDemoCounterRef.current
      liveDemoCounterRef.current += 1
      const next = generateLiveDemoPayment(seq)
      setLiveDemoRows((prev) => [next, ...prev].slice(0, 200))
    }, 10000)

    return () => window.clearInterval(intervalId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveDemoEnabled])

  const normalizedPayments = useMemo(() => {
  return transactions
    .map((item, idx) => normalizePaymentRow(item, idx))
    .filter((x): x is PaymentRow => x !== null)
}, [transactions])

  const rows = useMemo(() => {
    const sourceRows = liveDemoEnabled
      ? liveDemoRows.length > 0
        ? liveDemoRows
        : normalizedPayments
      : ALL_ROWS
    const today = new Date()
    const days = range === '7' ? 7 : range === '14' ? 14 : range === '30' ? 30 : 90
    const msPerDay = 1000 * 60 * 60 * 24

    return sourceRows
      .filter((row) => {
        const rd = parseDate(row.date)
        const diffDays = (today.getTime() - rd.getTime()) / msPerDay
        return diffDays >= 0 && diffDays <= days
      })
      .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime())
  }, [liveDemoEnabled, liveDemoRows, normalizedPayments, range])

  const total = useMemo(
    () => formatAmount(rows.reduce((sum, row) => sum + parseAmount(row.amount), 0)),
    [rows],
  )

  const handleExport = async (type: 'csv' | 'xls' | 'doc' | 'pdf') => {
    const rangeLabel = getRangeLabel(range)
    const modeLabel = liveDemoEnabled ? 'Live Demo' : 'Normal'
    const downloadedAt = formatDownloadedAt(new Date())
    const csv = buildCsv(rows, rangeLabel, modeLabel, downloadedAt)
    const xlsxBlob = buildXlsxBlob(rows, rangeLabel, modeLabel, downloadedAt)
    const timestamp = new Date().toISOString().slice(0, 10)
    const chamaName = 'Milestone Fraternity'
    const chamaSlug = chamaName.replace(/\s+/g, '-')
    const fileBase = `${chamaSlug}-received-payments-${timestamp}`
    if (type === 'csv') {
      download(csv, `${fileBase}.csv`, 'text/csv;charset=utf-8;')
    } else if (type === 'xls') {
      downloadBlob(xlsxBlob, `${fileBase}.xlsx`)
    } else if (type === 'doc') {
      const docxBlob = await buildDocxBlob(rows, rangeLabel, modeLabel, downloadedAt)
      downloadBlob(docxBlob, `${fileBase}.docx`)
    } else {
      const doc = buildPdf(rows, rangeLabel, modeLabel, downloadedAt)
      doc.save(`${fileBase}.pdf`)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('chama_token')
    logout()
    navigate('/login', { replace: true })
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
                onClick={handleLogout}
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

            <div className="modeSwitch" aria-label="Data source">
              <span className="modeSwitchLabel">Live Demo</span>
              <label className="switch">
                <input
                  className="switchInput"
                  type="checkbox"
                  checked={liveDemoEnabled}
                  onChange={(e) => setLiveDemoEnabled(e.target.checked)}
                />
                <span className="switchTrack">
                  <span className="switchThumb" />
                </span>
              </label>
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
