import { type MouseEvent, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { DashboardChrome } from '../components/DashboardChrome'
import { MetricPeriodDropdown, METRIC_PERIOD_OPTIONS_WITH_ALL_TIME } from '../components/MetricPeriodDropdown'
import { useContributionsData } from '../hooks/useContributionsData'
import { maskPhoneLastSixDigits } from '../lib/contributionsExport/maskPhone'
import type { ContributionsExportFormat } from '../lib/contributionsExport/types'
import '../App.css'

const EXPORT_OPTIONS = ['PDF', 'Excel', 'Doc', 'CSV'] as const satisfies readonly ContributionsExportFormat[]

export default function ContributionsPage() {
  const navigate = useNavigate()
  const { displayName, logout } = useAuth()
  const profileName = displayName || 'John Doe'
  const {
    displayedRows,
    rowsInPeriod,
    hasMoreRows,
    showAllRows,
    rowCount,
    totalAmount,
    summaryAmount,
    summaryTrendPct,
    period,
    setPeriod,
    periodSubtitle,
  } = useContributionsData()

  const [exportOpen, setExportOpen] = useState(false)
  const [exportBusy, setExportBusy] = useState(false)
  const exportWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!exportOpen) return undefined
    const onPointerDown = (e: PointerEvent) => {
      const el = exportWrapRef.current
      if (el && !el.contains(e.target as Node)) setExportOpen(false)
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

  const handleLogout = (evt?: MouseEvent<HTMLButtonElement>) => {
    evt?.preventDefault()
    localStorage.removeItem('chama_token')
    logout()
    navigate('/login', { replace: true })
  }

  const handleExport = async (format: ContributionsExportFormat) => {
    setExportOpen(false)
    setExportBusy(true)
    try {
      const { runContributionsExport } = await import('../lib/contributionsExport')
      await runContributionsExport(format, {
        rows: rowsInPeriod,
        periodLabel: periodSubtitle,
        exportedAt: new Date(),
      })
    } catch (err) {
      console.error(err)
      window.alert('Export failed. Please try again.')
    } finally {
      setExportBusy(false)
    }
  }

  return (
    <DashboardChrome profileName={profileName} onLogout={handleLogout}>
      <div className="mainContent contributionsMain">
        <article className="contributionsReportCard">
          <header className="contributionsReportHeader">
            <div className="contributionsReportIdentity">
              <div className="contributionsReportIconWrap" aria-hidden="true">
                <img src="/dashboard-icons/Contributions Active.svg" alt="" />
              </div>
              <div className="contributionsReportHeadingText">
                <h2 className="contributionsReportTitle">Contributions</h2>
                <p className="contributionsReportMeta">{periodSubtitle}</p>
                <div className="contributionsReportAmountRow">
                  <span className="contributionsReportAmount">
                    KES {summaryAmount.toLocaleString('en-US')}
                  </span>
                  <span className="trend positive">
                    <img src="/dashboard-icons/arrow-up-right.svg" alt="" />
                    {summaryTrendPct}
                  </span>
                </div>
              </div>
            </div>

            <div className="pageFilterControls contributionsReportFilters">
              <button type="button" className="filterButton">
                <img src="/dashboard-icons/Filter list.svg" alt="" />
                Filter
              </button>
              <MetricPeriodDropdown
                variant="page"
                period={period}
                onPeriodChange={setPeriod}
                menuId="contributions-report-period"
                periodOptions={METRIC_PERIOD_OPTIONS_WITH_ALL_TIME}
                periodLabelOverrides={{ last7: 'Weekly' }}
              />
            </div>
          </header>

          <div className="contributionsTableScroll" role="region" aria-label="Contribution transactions">
            <table className="contributionsTable">
              <caption className="visuallyHidden">
                Contributions: transaction ID, date, name, phone number, and amount in KES
              </caption>
              <thead>
                <tr>
                  <th scope="col">Transaction ID</th>
                  <th scope="col">Date</th>
                  <th scope="col">Name</th>
                  <th scope="col">Phone Number</th>
                  <th scope="col">Amount</th>
                </tr>
              </thead>
              <tbody>
                {displayedRows.map((row) => (
                  <tr key={row.transactionId}>
                    <td>{row.transactionId}</td>
                    <td>{row.date}</td>
                    <td>{row.name}</td>
                    <td>{maskPhoneLastSixDigits(row.phone)}</td>
                    <td className="contributionsAmountCell">{row.amount.toLocaleString('en-US')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hasMoreRows ? (
              <div className="contributionsTableShowMore">
                <button type="button" className="contributionsShowAllButton" onClick={showAllRows}>
                  Show all {rowCount} transactions
                </button>
              </div>
            ) : null}
          </div>

          <footer className="contributionsReportFooter">
            <div className="contributionsTotalRow">
              <span className="contributionsTotalLabel">Total</span>
              <strong className="contributionsTotalValue">{totalAmount.toLocaleString('en-US')}</strong>
            </div>
            <div className="contributionsExportWrap" ref={exportWrapRef}>
              <button
                type="button"
                className="contributionsExportButton"
                aria-haspopup="listbox"
                aria-expanded={exportOpen}
                aria-controls="contributions-export-menu"
                id="contributions-export-trigger"
                disabled={exportBusy}
                onClick={() => setExportOpen((o) => !o)}
              >
                {exportBusy ? 'Exporting…' : 'Export'}
                <img src="/dashboard-icons/chevron-down.svg" alt="" />
              </button>
              {exportOpen ? (
                <ul
                  className="contributionsExportMenu metricPeriodMenu"
                  id="contributions-export-menu"
                  role="listbox"
                  aria-labelledby="contributions-export-trigger"
                >
                  {EXPORT_OPTIONS.map((opt) => (
                    <li key={opt} role="presentation">
                      <button
                        type="button"
                        role="option"
                        disabled={exportBusy}
                        onClick={() => {
                          void handleExport(opt)
                        }}
                      >
                        {opt === 'Doc' ? 'Word' : opt}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </footer>
        </article>
      </div>
    </DashboardChrome>
  )
}
