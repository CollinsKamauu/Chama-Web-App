import { type MouseEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pie, PieChart, ResponsiveContainer } from 'recharts'
import { useAppMode } from '../hooks/useAppMode'
import { formatTrendPct, useDashboardData } from '../hooks/useDashboardData'
import { useAuth } from '../context/AuthContext'
import { DashboardChrome } from '../components/DashboardChrome'
import { MetricPeriodDropdown, type MetricPeriod } from '../components/MetricPeriodDropdown'
import '../App.css'

const formatKes = (value: number) => `KES ${value.toLocaleString()}`

/** Device local time: morning 5:00–11:59, afternoon 12:00–17:59, evening otherwise. */
function timeOfDayGreeting(date: Date): string {
  const h = date.getHours()
  if (h >= 5 && h < 12) return 'Good morning'
  if (h >= 12 && h < 18) return 'Good afternoon'
  return 'Good evening'
}

function maskBalanceAmountLabel(label: string): string {
  return label.replace(/[0-9,]/g, '*')
}

/** Smooth step for hover radius (Recharts Pie animation does not ease `outerRadius` changes). */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

function useAnimatedNumber(target: number, durationMs: number): number {
  const [value, setValue] = useState(target)
  const valueRef = useRef(value)
  valueRef.current = value

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      valueRef.current = target
      setValue(target)
      return undefined
    }
    const from = valueRef.current
    if (Math.abs(from - target) < 0.001) {
      if (valueRef.current !== target) {
        valueRef.current = target
        setValue(target)
      }
      return undefined
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = easeInOutCubic(t)
      const next = t < 1 ? from + (target - from) * eased : target
      valueRef.current = next
      setValue(next)
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])

  return value
}

export default function HomePage() {
  const navigate = useNavigate()
  const { mode, setMode } = useAppMode()
  const { displayName, logout } = useAuth()
  const profileName = useMemo(() => displayName || 'John Doe', [displayName])
  const [pageFilterPeriod, setPageFilterPeriod] = useState<MetricPeriod>('monthly')
  const [contributionPeriod, setContributionPeriod] = useState<MetricPeriod>('monthly')
  const [expenditurePeriod, setExpenditurePeriod] = useState<MetricPeriod>('monthly')
  const {
    contributionSummary,
    expenditureSummary,
    balanceSummary,
    balanceSlices,
    transactions,
    balanceAmountLabel,
    error: dashboardError,
  } = useDashboardData(contributionPeriod, expenditurePeriod, pageFilterPeriod)
  const [activeSliceIndex, setActiveSliceIndex] = useState<number | null>(null)
  const [balanceAmountVisible, setBalanceAmountVisible] = useState(true)
  const donutWrapRef = useRef<HTMLDivElement>(null)
  const donutLabelRafRef = useRef<number | null>(null)
  const [contributionLabelPosition, setContributionLabelPosition] = useState<{ x: number; y: number } | null>(null)
  const [expenditureLabelPosition, setExpenditureLabelPosition] = useState<{ x: number; y: number } | null>(null)
  const totalBalanceValue = useMemo(
    () => balanceSlices.reduce((sum, slice) => sum + slice.value, 0),
    [balanceSlices],
  )
  const contributionValue = balanceSlices[0]?.value ?? 0
  const expenditureValue = balanceSlices[1]?.value ?? 0
  const contributionSweep = totalBalanceValue > 0 ? (contributionValue / totalBalanceValue) * 360 : 0
  const contributionStartAngle = 90
  const contributionEndAngle = contributionStartAngle - contributionSweep
  const expenditureStartAngle = contributionEndAngle
  const expenditureEndAngle = -270
  const baseInnerRadius = 62.4
  const baseOuterRadius = 114
  const hoverOuterRadius = 122
  const sliceHoverDurationMs = 450
  const contributionOuterRadius = useAnimatedNumber(
    activeSliceIndex === 0 ? hoverOuterRadius : baseOuterRadius,
    sliceHoverDurationMs,
  )
  const expenditureOuterRadius = useAnimatedNumber(
    activeSliceIndex === 1 ? hoverOuterRadius : baseOuterRadius,
    sliceHoverDurationMs,
  )

  const handleLogout = (evt?: MouseEvent<HTMLButtonElement>) => {
    evt?.preventDefault()
    localStorage.removeItem('chama_token')
    logout()
    navigate('/login', { replace: true })
  }

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

    const nextContribution = getLocalCenterFromSectorName(balanceSlices[0]?.name ?? 'Contributions')
    const nextExpenditure = getLocalCenterFromSectorName(balanceSlices[1]?.name ?? 'Expenditure')

    if (nextContribution) setContributionLabelPosition(nextContribution)
    if (nextExpenditure) setExpenditureLabelPosition(nextExpenditure)
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
  }, [balanceSlices])

  return (
    <DashboardChrome profileName={profileName} onLogout={handleLogout}>
      <div className="mainContent">
          <div className="contentTopBar">
            <h2>
              {timeOfDayGreeting(new Date())}, {profileName.split(' ')[0] || profileName} 👋
            </h2>
            {dashboardError ? <p className="financesInlineError">{dashboardError}</p> : null}
            <div className="contentTopBarRight">
              <div className="appModeSwitch">
                <button
                  type="button"
                  role="switch"
                  aria-checked={mode === 'live'}
                  aria-label={
                    mode === 'live'
                      ? 'Live data is on. Press to use demo data.'
                      : 'Demo data is on. Press to use live data.'
                  }
                  className={`appModeSwitchTrack${mode === 'live' ? ' appModeSwitchTrack--live' : ''}`}
                  onClick={() => setMode(mode === 'demo' ? 'live' : 'demo')}
                >
                  <span className="appModeSwitchThumb" />
                </button>
                <span className="appModeSwitchSideLabel" aria-hidden="true">
                  {mode === 'live' ? 'Live' : 'Demo'}
                </span>
              </div>
              <div className="pageFilterControls">
                <MetricPeriodDropdown
                  variant="page"
                  period={pageFilterPeriod}
                  onPeriodChange={setPageFilterPeriod}
                  menuId="page-filter-period"
                />
                <button type="button" className="filterButton">
                  <img src="/dashboard-icons/Filter list.svg" alt="" />
                  Filter
                </button>
              </div>
            </div>
          </div>

          <div className="metricsRow">
            <article className="metricCard contribution">
              <div className="metricHead">
                <h3>Contributions</h3>
                <div className="chipRow">
                  <MetricPeriodDropdown
                    period={contributionPeriod}
                    onPeriodChange={setContributionPeriod}
                    menuId="metric-period-contribution"
                  />
                  <button type="button" className="iconChip">
                    <img src="/dashboard-icons/more-vertical.svg" alt="" />
                  </button>
                </div>
              </div>
              <div className="metricBody">
                <div className="metricIconWrap">
                  <img src="/dashboard-icons/Contributions Active.svg" alt="" />
                </div>
                <div className="metricDetails">
                  <div className="valueMeta">
                    <span className={`trend ${contributionSummary.trend >= 0 ? 'positive' : 'negative'}`}>
                      <img
                        src={
                          contributionSummary.trend >= 0
                            ? '/dashboard-icons/arrow-up-right.svg'
                            : '/dashboard-icons/arrow-down-right.svg'
                        }
                        alt=""
                      />
                      {formatTrendPct(contributionSummary.trend)}
                    </span>
                  </div>
                  <p>KES {contributionSummary.total.toLocaleString('en-US')}</p>
                </div>
              </div>
            </article>

            <article className="metricCard expenditure">
              <div className="metricHead">
                <h3>Expenditure</h3>
                <div className="chipRow">
                  <MetricPeriodDropdown
                    period={expenditurePeriod}
                    onPeriodChange={setExpenditurePeriod}
                    menuId="metric-period-expenditure"
                  />
                  <button type="button" className="iconChip">
                    <img src="/dashboard-icons/more-vertical.svg" alt="" />
                  </button>
                </div>
              </div>
              <div className="metricBody">
                <div className="metricIconWrap">
                  <img src="/dashboard-icons/Bills Active Dashboard.svg" alt="" />
                </div>
                <div className="metricDetails">
                  <div className="valueMeta">
                    <span className={`trend ${expenditureSummary.trend <= 0 ? 'negative' : 'positive'}`}>
                      <img
                        src={
                          expenditureSummary.trend <= 0
                            ? '/dashboard-icons/arrow-down-right.svg'
                            : '/dashboard-icons/arrow-up-right.svg'
                        }
                        alt=""
                      />
                      {formatTrendPct(expenditureSummary.trend)}
                    </span>
                  </div>
                  <p>KES {expenditureSummary.total.toLocaleString('en-US')}</p>
                </div>
              </div>
            </article>
          </div>

          <article className="balanceCard">
            <div className="balanceHeader">
              <div className="balanceTitleWrap">
                <div className="balanceIcon">
                  <img src="/dashboard-icons/Finances Active.svg" alt="" />
                </div>
                <div>
                  <div className="balanceTitleHeadingRow">
                    <h3>Balance</h3>
                    <button
                      type="button"
                      className="balanceVisibilityToggle"
                      onClick={() => setBalanceAmountVisible((v) => !v)}
                      aria-label={balanceAmountVisible ? 'Hide balance amount' : 'Show balance amount'}
                      aria-pressed={!balanceAmountVisible}
                    >
                      <img
                        src={
                          balanceAmountVisible
                            ? '/dashboard-icons/Hide-Password-1.svg'
                            : '/dashboard-icons/Show-Password-1.svg'
                        }
                        alt=""
                        width={24}
                        height={24}
                      />
                    </button>
                  </div>
                  <div className="balanceAmountRow">
                    <strong aria-live="polite">
                      {balanceAmountVisible
                        ? balanceAmountLabel
                        : maskBalanceAmountLabel(balanceAmountLabel)}
                    </strong>
                    <span className={`trend ${balanceSummary.trend >= 0 ? 'positive' : 'negative'}`}>
                      <img
                        src={
                          balanceSummary.trend >= 0
                            ? '/dashboard-icons/arrow-up-right.svg'
                            : '/dashboard-icons/arrow-down-right.svg'
                        }
                        alt=""
                      />
                      {formatTrendPct(balanceSummary.trend)}
                    </span>
                    <small>Compared to last month</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="balanceBody">
              <div className="chartPane">
                <div className="legend">
                  {balanceSlices.map((slice) => (
                    <span key={slice.name}>
                      <i className="dot" style={{ background: slice.color }} />
                      {slice.name}
                    </span>
                  ))}
                </div>
                <div className="donutWrap" ref={donutWrapRef}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={balanceSlices[0] ? [balanceSlices[0]] : []}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={baseInnerRadius}
                        outerRadius={contributionOuterRadius}
                        startAngle={contributionStartAngle}
                        endAngle={contributionEndAngle}
                        cornerRadius={6}
                        isAnimationActive={false}
                        fill={balanceSlices[0]?.color ?? '#1f73dc'}
                        stroke="#ffffff"
                        strokeWidth={5}
                        onMouseEnter={() => setActiveSliceIndex(0)}
                        onMouseLeave={() => setActiveSliceIndex(null)}
                      />
                      <Pie
                        data={balanceSlices[1] ? [balanceSlices[1]] : []}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={baseInnerRadius}
                        outerRadius={expenditureOuterRadius}
                        startAngle={expenditureStartAngle}
                        endAngle={expenditureEndAngle}
                        cornerRadius={6}
                        isAnimationActive={false}
                        fill={balanceSlices[1]?.color ?? '#ff9348'}
                        stroke="#ffffff"
                        strokeWidth={5}
                        onMouseEnter={() => setActiveSliceIndex(1)}
                        onMouseLeave={() => setActiveSliceIndex(null)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <span
                    className="donutLabel left"
                    style={{
                      left: contributionLabelPosition ? `${contributionLabelPosition.x}px` : undefined,
                      top: contributionLabelPosition ? `${contributionLabelPosition.y}px` : undefined,
                      opacity: contributionLabelPosition ? 1 : 0,
                    }}
                  >
                    {formatKes(contributionValue)}
                  </span>
                  <span
                    className="donutLabel right"
                    style={{
                      left: expenditureLabelPosition ? `${expenditureLabelPosition.x}px` : undefined,
                      top: expenditureLabelPosition ? `${expenditureLabelPosition.y}px` : undefined,
                      opacity: expenditureLabelPosition ? 1 : 0,
                    }}
                  >
                    {formatKes(expenditureValue)}
                  </span>
                  <span className="visuallyHidden">{formatKes(totalBalanceValue)} total</span>
                </div>
              </div>

              <div className="transactionsPane">
                <h4>Transactions</h4>
                <div
                  className="transactionsScroll"
                  role="region"
                  aria-label="Recent transactions"
                  tabIndex={0}
                >
                  <table className="transactionsTable">
                    <caption className="visuallyHidden">
                      Recent transactions: date, name, category, and amount in KES
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Date</th>
                        <th scope="col">Name</th>
                        <th scope="col">Category</th>
                        <th scope="col">Amount (KES)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((row) => (
                        <tr key={row.id}>
                          <td>{row.date}</td>
                          <td>{row.name}</td>
                          <td>
                            <span className={`pill ${row.colorClass}`}>{row.category}</span>
                          </td>
                          <td className="transactionsAmount">{row.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </article>
        </div>
    </DashboardChrome>
  )
}
