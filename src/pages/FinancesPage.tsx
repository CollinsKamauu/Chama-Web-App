import { type MouseEvent, type RefObject, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Pie, PieChart, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { FinancesRowActionsMenu } from '../components/FinancesRowActionsMenu'
import { DashboardChrome } from '../components/DashboardChrome'
import {
  MetricPeriodDropdown,
  METRIC_PERIOD_LABEL,
  METRIC_PERIOD_OPTIONS_WITH_ALL_TIME,
} from '../components/MetricPeriodDropdown'
import { useAuth } from '../context/AuthContext'
import { useExpenditureData } from '../hooks/useExpenditureData'
import {
  blobDownloadNeedsFollowingUserGesture,
  downloadBlob,
  formatExportStamp,
  savePreparedBlobAsFile,
} from '../lib/contributionsExport/download'
import { maskPhoneLastSixDigits } from '../lib/contributionsExport/maskPhone'
import { exportExpenditureCsv } from '../lib/financesExport/exportExpenditureCsv'
import { exportExpenditurePdf } from '../lib/financesExport/exportExpenditurePdf'
import { exportExpenditureXlsx } from '../lib/financesExport/exportExpenditureXlsx'
import { buildFundBalancePdfBlob } from '../lib/financesExport/exportFundBalancePdf'
import type { ExpenditureRow, ExpenditureType } from '../types/finances'
import '../App.css'

const EXPENDITURE_HEADER_TOTAL = 160_890
const BALANCE_TREND_PCT = '15.8%'

const EXPORT_OPTIONS = ['PDF', 'Excel', 'CSV'] as const

const CHART_COLORS = ['#1f73dc', '#ff9348'] as const

const BALANCE_CHART_INCOME_NAME = 'Contributions'
const BALANCE_CHART_EXPENSES_NAME = 'Expenditure'

const formatKes = (value: number) => `KES ${value.toLocaleString('en-US')}`

const EXPENDITURE_TYPE_PILL_CLASS: Record<ExpenditureType, string> = {
  Benevolent: 'financesTypePill--benevolent',
  Event: 'financesTypePill--event',
  Disbursement: 'financesTypePill--disbursement',
  Miscellaneous: 'financesTypePill--miscellaneous',
  Bill: 'financesTypePill--bill',
  'Service Provider': 'financesTypePill--service-provider',
}

function expenditureTypeClass(t: ExpenditureType): string {
  return `financesTypePill ${EXPENDITURE_TYPE_PILL_CLASS[t]}`
}

type ExportSlotProps = {
  variant: 'desktop' | 'mobile'
  exportOpen: boolean
  setExportOpen: (next: boolean | ((prev: boolean) => boolean)) => void
  wrapRef: RefObject<HTMLDivElement | null>
  onExport: (format: (typeof EXPORT_OPTIONS)[number]) => void
}

function FinancesExportControl({ variant, exportOpen, setExportOpen, wrapRef, onExport }: ExportSlotProps) {
  const suffix = variant === 'desktop' ? 'desktop' : 'mobile'
  const menuId = `finances-exp-export-menu-${suffix}`
  const triggerId = `finances-exp-export-trigger-${suffix}`
  return (
    <div
      ref={wrapRef}
      className={`contributionsExportWrap financesToolbarExport financesToolbarExport--${variant}`}
    >
      <button
        type="button"
        className="contributionsExportButton"
        aria-haspopup="listbox"
        aria-expanded={exportOpen}
        aria-controls={menuId}
        id={triggerId}
        onClick={() => setExportOpen((o) => !o)}
      >
        Export
        <img src="/dashboard-icons/chevron-down.svg" alt="" />
      </button>
      {exportOpen ? (
        <ul className="contributionsExportMenu metricPeriodMenu" id={menuId} role="listbox" aria-labelledby={triggerId}>
          {EXPORT_OPTIONS.map((opt) => (
            <li key={opt} role="presentation">
              <button type="button" role="option" onClick={() => void onExport(opt)}>
                {opt}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export default function FinancesPage() {
  const navigate = useNavigate()
  const { displayName, logout, chamaOrganizationName } = useAuth()
  const profileName = displayName || 'John Doe'

  const {
    loading,
    error,
    period,
    setPeriod,
    periodSubtitle,
    searchQuery,
    setSearchQuery,
    rows,
    paginatedRows,
    page,
    totalPages,
    goPrev,
    goNext,
    setPage,
    expenditureTrendPct,
    balanceSummary,
  } = useExpenditureData()

  const [menuFor, setMenuFor] = useState<{ id: string; top: number; left: number } | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [fundBalancePdfBusy, setFundBalancePdfBusy] = useState(false)
  /** iOS WebKit: PDF built async; user must tap again so downloadBlob runs on a fresh gesture. */
  const [balancePdfReadyToSave, setBalancePdfReadyToSave] = useState<{ blob: Blob; filename: string } | null>(null)
  const exportDesktopRef = useRef<HTMLDivElement>(null)
  const exportMobileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!exportOpen) return undefined
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (exportDesktopRef.current?.contains(t) || exportMobileRef.current?.contains(t)) return
      setExportOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [exportOpen])

  useEffect(() => {
    if (!exportOpen) return undefined
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setExportOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [exportOpen])

  useEffect(() => {
    setMenuFor(null)
  }, [page])

  const { incomeStartAngle, incomeEndAngle, expensesStartAngle, expensesEndAngle } = useMemo(() => {
    const total = balanceSummary.totalIncome + balanceSummary.totalExpenses
    if (total <= 0) {
      return {
        incomeStartAngle: 90,
        incomeEndAngle: -270,
        expensesStartAngle: -270,
        expensesEndAngle: -270,
      }
    }
    const incomeSweep = (balanceSummary.totalIncome / total) * 360
    const start = 90
    const incomeEnd = start - incomeSweep
    return {
      incomeStartAngle: start,
      incomeEndAngle: incomeEnd,
      expensesStartAngle: incomeEnd,
      expensesEndAngle: -270,
    }
  }, [balanceSummary.totalIncome, balanceSummary.totalExpenses])

  const totalPieValue = balanceSummary.totalIncome + balanceSummary.totalExpenses

  const donutWrapRef = useRef<HTMLDivElement>(null)
  const donutLabelRafRef = useRef<number | null>(null)
  const [incomeLabelPosition, setIncomeLabelPosition] = useState<{ x: number; y: number } | null>(null)
  const [expensesLabelPosition, setExpensesLabelPosition] = useState<{ x: number; y: number } | null>(null)

  const updateDonutLabelPositions = () => {
    const wrap = donutWrapRef.current
    if (!wrap) return

    const wrapRect = wrap.getBoundingClientRect()
    if (wrapRect.width <= 0 || wrapRect.height <= 0) return

    const getLocalCenterFromSectorName = (name: string) => {
      const sector = wrap.querySelector(`.recharts-sector[name="${name}"]`) as SVGGraphicsElement | null
      if (!sector) return null
      const rect = sector.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return null
      return {
        x: rect.left + rect.width / 2 - wrapRect.left,
        y: rect.top + rect.height / 2 - wrapRect.top,
      }
    }

    const nextIncome = getLocalCenterFromSectorName(BALANCE_CHART_INCOME_NAME)
    const nextExpenses = getLocalCenterFromSectorName(BALANCE_CHART_EXPENSES_NAME)

    if (nextIncome) setIncomeLabelPosition(nextIncome)
    if (nextExpenses) setExpensesLabelPosition(nextExpenses)
  }

  const scheduleDonutLabelUpdate = () => {
    if (donutLabelRafRef.current != null) cancelAnimationFrame(donutLabelRafRef.current)
    donutLabelRafRef.current = requestAnimationFrame(() => {
      donutLabelRafRef.current = null
      updateDonutLabelPositions()
    })
  }

  useLayoutEffect(() => {
    scheduleDonutLabelUpdate()
  })

  useEffect(() => {
    const wrap = donutWrapRef.current
    if (!wrap) return undefined

    const onResize = () => scheduleDonutLabelUpdate()
    window.addEventListener('resize', onResize)

    const ro = new ResizeObserver(() => scheduleDonutLabelUpdate())
    ro.observe(wrap)

    return () => {
      window.removeEventListener('resize', onResize)
      ro.disconnect()
      if (donutLabelRafRef.current != null) cancelAnimationFrame(donutLabelRafRef.current)
    }
  }, [])

  const menuRow = useMemo(
    () => (menuFor ? paginatedRows.find((r) => r.id === menuFor.id) : undefined),
    [menuFor, paginatedRows],
  )

  const openRowMenu = (e: MouseEvent<HTMLButtonElement>, row: ExpenditureRow) => {
    e.stopPropagation()
    const r = e.currentTarget.getBoundingClientRect()
    const menuWidth = 200
    const left = Math.max(8, Math.min(r.right - menuWidth, window.innerWidth - menuWidth - 8))
    const top = r.bottom + 6
    setMenuFor((prev) => (prev?.id === row.id ? null : { id: row.id, top, left }))
  }

  const handleLogout = (evt?: MouseEvent<HTMLButtonElement>) => {
    evt?.preventDefault()
    localStorage.removeItem('chama_token')
    logout()
    navigate('/login', { replace: true })
  }

  const placeholderAction = useCallback((action: string, row: ExpenditureRow) => {
    console.info(`[finances API placeholder] ${action}`, row.transactionId)
  }, [])

  const handleDeleteRow = useCallback(
    (row: ExpenditureRow) => {
      if (!window.confirm(`Delete transaction ${row.transactionId}?`)) return
      placeholderAction('delete', row)
      setMenuFor(null)
    },
    [placeholderAction],
  )

  const handleExport = useCallback(
    async (format: (typeof EXPORT_OPTIONS)[number]) => {
      setExportOpen(false)
      const periodLabel = METRIC_PERIOD_LABEL[period]
      const exportedAt = new Date()
      try {
        if (format === 'PDF') {
          await exportExpenditurePdf(rows, periodLabel, exportedAt)
        } else if (format === 'Excel') {
          await exportExpenditureXlsx(rows, periodLabel, exportedAt)
        } else {
          exportExpenditureCsv(rows, periodLabel, exportedAt)
        }
      } catch (err) {
        console.error('Expenditure export failed.', err)
      }
    },
    [period, rows],
  )

  useEffect(() => {
    setBalancePdfReadyToSave(null)
  }, [period])

  const handleFundBalancePdf = useCallback(() => {
    if (balancePdfReadyToSave) {
      const { blob, filename } = balancePdfReadyToSave
      setBalancePdfReadyToSave(null)
      savePreparedBlobAsFile(blob, filename)
      return
    }

    setFundBalancePdfBusy(true)
    void (async () => {
      const exportedAt = new Date()
      try {
        const blob = await buildFundBalancePdfBlob({
          totalIncome: balanceSummary.totalIncome,
          totalExpenses: balanceSummary.totalExpenses,
          netBalance: balanceSummary.netBalance,
          periodLabel: METRIC_PERIOD_LABEL[period],
          exportedAt,
        })
        const filename = `milestone-fraternity-fund-balance-${formatExportStamp(exportedAt)}.pdf`
        if (blobDownloadNeedsFollowingUserGesture()) {
          setBalancePdfReadyToSave({ blob, filename })
        } else {
          downloadBlob(blob, filename)
        }
      } catch (err) {
        console.error('Fund balance PDF export failed.', err)
      } finally {
        setFundBalancePdfBusy(false)
      }
    })()
  }, [
    balancePdfReadyToSave,
    balanceSummary.netBalance,
    balanceSummary.totalExpenses,
    balanceSummary.totalIncome,
    period,
  ])

  const pageNumbers = useMemo(() => {
    const out: number[] = []
    const windowSize = 3
    let start = Math.max(1, page - 1)
    let end = Math.min(totalPages, start + windowSize - 1)
    if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1)
    for (let i = start; i <= end; i += 1) out.push(i)
    return out
  }, [page, totalPages])

  return (
    <DashboardChrome profileName={profileName} onLogout={handleLogout}>
      <div className="mainContent contributionsMain financesMain">
        <article className="contributionsReportCard financesExpenditureCard">
          <header className="contributionsReportHeader financesReportHeader">
            <div className="contributionsReportIdentity">
              <div className="contributionsReportIconWrap financesExpenditureIconWrap" aria-hidden="true">
                <img src="/dashboard-icons/Bills Active Dashboard.svg" alt="" />
              </div>
              <div className="contributionsReportHeadingText">
                <h2 className="contributionsReportTitle">Expenditure</h2>
                <p className="contributionsReportMeta">{periodSubtitle}</p>
                <div className="contributionsReportAmountRow">
                  <span className="contributionsReportAmount">KES {EXPENDITURE_HEADER_TOTAL.toLocaleString('en-US')}</span>
                  <span className="trend negative">
                    <img src="/dashboard-icons/arrow-down-right.svg" alt="" />
                    {expenditureTrendPct}
                  </span>
                </div>
              </div>
            </div>

            <div className="financesToolbar">
              <label className="visuallyHidden" htmlFor="finances-exp-search">
                Search transactions
              </label>
              <div className="financesSearchWrap">
                <img src="/dashboard-icons/search.svg" alt="" aria-hidden="true" />
                <input
                  id="finances-exp-search"
                  type="search"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="financesToolbarFilterSlot">
                <button type="button" className="filterButton">
                  <img src="/dashboard-icons/Filter list.svg" alt="" />
                  Filter
                </button>
              </div>
              <div className="financesToolbarPeriodSlot">
                <MetricPeriodDropdown
                  variant="page"
                  period={period}
                  onPeriodChange={setPeriod}
                  menuId="finances-expenditure-period"
                  periodOptions={METRIC_PERIOD_OPTIONS_WITH_ALL_TIME}
                />
              </div>
              <FinancesExportControl
                variant="desktop"
                exportOpen={exportOpen}
                setExportOpen={setExportOpen}
                wrapRef={exportDesktopRef}
                onExport={handleExport}
              />
            </div>
          </header>

          {error ? <p className="financesInlineError">{error}</p> : null}

          <div className="contributionsTableScroll financesTableScroll" role="region" aria-label="Expenditure transactions">
            <table className="contributionsTable financesTable">
              <caption className="visuallyHidden">
                Expenditure: transaction ID, date, name, phone, type, amount, and actions
              </caption>
              <thead>
                <tr>
                  <th scope="col">Transaction ID</th>
                  <th scope="col">Date</th>
                  <th scope="col">Name</th>
                  <th scope="col">Phone Number</th>
                  <th scope="col">Type</th>
                  <th scope="col">Amount</th>
                  <th scope="col">
                    <span className="visuallyHidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="financesTableLoading">
                      Loading…
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.transactionId}</td>
                      <td>{row.date}</td>
                      <td>{row.name}</td>
                      <td>{maskPhoneLastSixDigits(row.phone)}</td>
                      <td>
                        <span className={expenditureTypeClass(row.type)}>{row.type}</span>
                      </td>
                      <td className="contributionsAmountCell">{row.amount.toLocaleString('en-US')}</td>
                      <td className="financesActionsCell">
                        <button
                          type="button"
                          className="financesRowMenuButton"
                          aria-label={`Actions for ${row.transactionId}`}
                          aria-haspopup="menu"
                          aria-expanded={menuFor?.id === row.id}
                          data-finances-actions-trigger={row.id}
                          onClick={(e) => openRowMenu(e, row)}
                        >
                          <img src="/dashboard-icons/more-vertical.svg" alt="" width={20} height={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <footer className="financesPagination" aria-label="Expenditure table pagination">
            <button type="button" className="financesPaginationBtn" disabled={page <= 1} onClick={goPrev}>
              Previous
            </button>
            <div className="financesPaginationPages" role="group" aria-label="Page">
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`financesPaginationNum${n === page ? ' isActive' : ''}`}
                  aria-current={n === page ? 'page' : undefined}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <button type="button" className="financesPaginationBtn" disabled={page >= totalPages} onClick={goNext}>
              Next
            </button>
          </footer>

          <div className="financesExportAfterPagination">
            <FinancesExportControl
              variant="mobile"
              exportOpen={exportOpen}
              setExportOpen={setExportOpen}
              wrapRef={exportMobileRef}
              onExport={handleExport}
            />
          </div>
        </article>

        <article className="contributionsReportCard financesBalanceCard">
          <header className="contributionsReportHeader financesBalanceHeader">
            <div className="contributionsReportIdentity">
              <div className="contributionsReportIconWrap financesBalanceIconWrap" aria-hidden="true">
                <img src="/dashboard-icons/Finances Active.svg" alt="" />
              </div>
              <div className="contributionsReportHeadingText">
                <h2 className="contributionsReportTitle">Balance</h2>
                <p className="contributionsReportMeta">Current balance</p>
                <div className="contributionsReportAmountRow">
                  <span className="contributionsReportAmount">
                    KES {balanceSummary.netBalance.toLocaleString('en-US')}
                  </span>
                  <span className="trend positive">
                    <img src="/dashboard-icons/arrow-up-right.svg" alt="" />
                    {BALANCE_TREND_PCT}
                  </span>
                </div>
              </div>
            </div>
          </header>

          <div className="financesBalanceBody">
            <div className="financesChartPane">
              <div className="legend financesDonutLegend">
                <span>
                  <i className="dot" style={{ background: CHART_COLORS[0] }} />
                  Contributions
                </span>
                <span>
                  <i className="dot" style={{ background: CHART_COLORS[1] }} />
                  Expenditure
                </span>
              </div>
              <div className="financesDonutWrap" ref={donutWrapRef}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[{ name: BALANCE_CHART_INCOME_NAME, value: balanceSummary.totalIncome }]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="58%"
                      outerRadius="88%"
                      startAngle={incomeStartAngle}
                      endAngle={incomeEndAngle}
                      cornerRadius={6}
                      isAnimationActive={false}
                      fill={CHART_COLORS[0]}
                      stroke="#ffffff"
                      strokeWidth={4}
                    />
                    <Pie
                      data={[{ name: BALANCE_CHART_EXPENSES_NAME, value: balanceSummary.totalExpenses }]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="58%"
                      outerRadius="88%"
                      startAngle={expensesStartAngle}
                      endAngle={expensesEndAngle}
                      cornerRadius={6}
                      isAnimationActive={false}
                      fill={CHART_COLORS[1]}
                      stroke="#ffffff"
                      strokeWidth={4}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <span
                  className="donutLabel left"
                  style={{
                    left: incomeLabelPosition ? `${incomeLabelPosition.x}px` : undefined,
                    top: incomeLabelPosition ? `${incomeLabelPosition.y}px` : undefined,
                    opacity: incomeLabelPosition ? 1 : 0,
                  }}
                >
                  {formatKes(balanceSummary.totalIncome)}
                </span>
                <span
                  className="donutLabel right"
                  style={{
                    left: expensesLabelPosition ? `${expensesLabelPosition.x}px` : undefined,
                    top: expensesLabelPosition ? `${expensesLabelPosition.y}px` : undefined,
                    opacity: expensesLabelPosition ? 1 : 0,
                  }}
                >
                  {formatKes(balanceSummary.totalExpenses)}
                </span>
                <span className="visuallyHidden">
                  {formatKes(totalPieValue)} total income and expenses
                </span>
              </div>
            </div>

            <div className="financesStatement">
              <div className="financesStatementAccent" aria-hidden="true" />
              <div className="financesStatementHeader">
                <div className="financesStatementTitleRow">
                  <h3 className="financesStatementOrg">{chamaOrganizationName}</h3>
                  <div className="financesStatementHeaderIcon" aria-hidden="true">
                    <img src="/dashboard-icons/Chama App Demo Logo.svg" alt="" width={40} height={40} />
                  </div>
                </div>
                <p className="financesStatementSub">Fund Balance</p>
              </div>

              <div className="financesStatementTableWrap">
                <table className="financesStatementTable">
                  <caption className="visuallyHidden">
                    Fund balance: description and amount; final balance in KES
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Description</th>
                      <th scope="col">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Contributions</td>
                      <td className="financesStatementAmountCell">
                        {balanceSummary.totalIncome.toLocaleString('en-US')}
                      </td>
                    </tr>
                    <tr>
                      <td>Expenditure</td>
                      <td className="financesStatementAmountCell financesStatementAmountCell--deduct">
                        -{balanceSummary.totalExpenses.toLocaleString('en-US')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="financesStatementBalanceBlock">
                <div className="financesStatementBalanceRow">
                  <span className="financesStatementBalanceLabel">Balance</span>
                  <span className="financesStatementBalanceAmount">
                    KES {balanceSummary.netBalance.toLocaleString('en-US')}
                  </span>
                </div>
              </div>

              <div className="financesStatementDisclaimer">
                <strong className="financesStatementDisclaimerLabel">Disclaimer:</strong>
                <div className="financesStatementDisclaimerBody">
                  <p>This is not an official financial statement.</p>
                  <p>
                    For audited records and official account balances, please refer to your monthly M-Pesa statement
                    or the M-Pesa Business Portal.
                  </p>
                </div>
              </div>

              <div className="financesStatementActions">
                <button
                  type="button"
                  className="financesDownloadPdfBtn"
                  disabled={fundBalancePdfBusy}
                  onClick={handleFundBalancePdf}
                >
                  {fundBalancePdfBusy
                    ? 'Preparing...'
                    : balancePdfReadyToSave
                      ? 'Save PDF'
                      : 'Download PDF'}
                </button>
                {balancePdfReadyToSave ? (
                  <p className="financesPdfReadyHint" role="status" aria-live="polite">
                    PDF is ready — tap Save PDF to download or share to Files / Drive.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </article>
      </div>

      {menuFor && menuRow ? (
        <FinancesRowActionsMenu
          transactionLabel={menuRow.transactionId}
          position={{ top: menuFor.top, left: menuFor.left }}
          onClose={() => setMenuFor(null)}
          onViewDetails={() => placeholderAction('view', menuRow)}
          onEdit={() => placeholderAction('edit', menuRow)}
          onDelete={() => handleDeleteRow(menuRow)}
        />
      ) : null}
    </DashboardChrome>
  )
}
