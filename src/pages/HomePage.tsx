import { type MouseEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pie, PieChart, ResponsiveContainer } from 'recharts'
import { useAuth } from '../context/AuthContext'
import { DashboardChrome } from '../components/DashboardChrome'
import { MetricPeriodDropdown, type MetricPeriod } from '../components/MetricPeriodDropdown'
import '../App.css'

type TransactionRow = {
  id: string
  date: string
  name: string
  category: string
  amount: string
  colorClass: string
}

type BalanceSlice = {
  name: string
  value: number
  color: string
}

const MOCK_TX_NAMES = [
  'Grace Muthoni',
  'Peter Otieno',
  'Wanjiku Njeri',
  'James Kariuki',
  'Amina Hassan',
  'David Ochieng',
  'Lucy Chebet',
  'Samuel Njoroge',
  'Mary Akinyi',
  'Tom Mwenda',
  'Ruth Wambui',
  'Brian Mutua',
  'Esther Adhiambo',
  'Kevin Kamau',
]

const MOCK_TX_AMOUNTS = [
  450, 1200, 1675, 2100, 3200, 4999, 5050, 7500, 8900, 9999, 11250, 12750, 15600, 18900, 22300, 28400,
  33333, 44550, 50100, 67890, 725, 15440, 18200, 960, 30300, 4125, 7777, 13131,
]

const MOCK_TX_CATEGORIES: { category: string; colorClass: TransactionRow['colorClass'] }[] = [
  { category: 'Service provider', colorClass: 'orange' },
  { category: 'Benevolent', colorClass: 'blue' },
  { category: 'Disbursement', colorClass: 'green' },
  { category: 'Event', colorClass: 'yellow' },
  { category: 'Miscellaneous', colorClass: 'gray' },
  { category: 'Contribution', colorClass: 'blue' },
]

/** Placeholder rows until transactions load from the API. */
const TRANSACTIONS: TransactionRow[] = MOCK_TX_AMOUNTS.map((rawAmount, i) => {
  const day = 28 - ((i * 5) % 26)
  const month = 2 + ((i * 3) % 2)
  const meta = MOCK_TX_CATEGORIES[(i * 7) % MOCK_TX_CATEGORIES.length]
  return {
    id: `tx-${i + 1}`,
    date: `${day}/${month}/2026`,
    name: MOCK_TX_NAMES[(i * 11 + 4) % MOCK_TX_NAMES.length],
    category: meta.category,
    colorClass: meta.colorClass,
    amount: rawAmount.toLocaleString('en-US'),
  }
})

const BALANCE_SLICES: BalanceSlice[] = [
  { name: 'Contributions', value: 630450, color: '#1f73dc' },
  { name: 'Expenditure', value: 160890, color: '#ff9348' },
]

const formatKes = (value: number) => `KES ${value.toLocaleString()}`

/** Placeholder name in the hero greeting; replace with sign-up / profile data when wired. */
const DASHBOARD_GREETING_NAME = 'John'

/** Device local time: morning 5:00–11:59, afternoon 12:00–17:59, evening otherwise. */
function timeOfDayGreeting(date: Date): string {
  const h = date.getHours()
  if (h >= 5 && h < 12) return 'Good morning'
  if (h >= 12 && h < 18) return 'Good afternoon'
  return 'Good evening'
}

/** Shown in the balance card until wired to live totals. */
const BALANCE_CARD_AMOUNT_LABEL = 'KES 469,560'

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
  const { displayName, logout } = useAuth()
  const profileName = useMemo(() => displayName || 'John Doe', [displayName])
  const [pageFilterPeriod, setPageFilterPeriod] = useState<MetricPeriod>('monthly')
  const [contributionPeriod, setContributionPeriod] = useState<MetricPeriod>('monthly')
  const [expenditurePeriod, setExpenditurePeriod] = useState<MetricPeriod>('monthly')
  const [activeSliceIndex, setActiveSliceIndex] = useState<number | null>(null)
  const [balanceAmountVisible, setBalanceAmountVisible] = useState(true)
  const donutWrapRef = useRef<HTMLDivElement>(null)
  const donutLabelRafRef = useRef<number | null>(null)
  const [contributionLabelPosition, setContributionLabelPosition] = useState<{ x: number; y: number } | null>(null)
  const [expenditureLabelPosition, setExpenditureLabelPosition] = useState<{ x: number; y: number } | null>(null)
  const totalBalanceValue = useMemo(
    () => BALANCE_SLICES.reduce((sum, slice) => sum + slice.value, 0),
    [],
  )
  const contributionValue = BALANCE_SLICES[0].value
  const contributionSweep = (contributionValue / totalBalanceValue) * 360
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

    const nextContribution = getLocalCenterFromSectorName(BALANCE_SLICES[0].name)
    const nextExpenditure = getLocalCenterFromSectorName(BALANCE_SLICES[1].name)

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
  }, [])

  return (
    <DashboardChrome profileName={profileName} onLogout={handleLogout}>
      <div className="mainContent">
          <div className="contentTopBar">
            <h2>
              {timeOfDayGreeting(new Date())}, {DASHBOARD_GREETING_NAME} 👋
            </h2>
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
                    <span className="trend positive">
                      <img src="/dashboard-icons/arrow-up-right.svg" alt="" />
                      15.8% 
                    </span>
                    <span className="currency">+24,500</span>
                  </div>
                  <p>KES 630,450</p>
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
                    <span className="trend negative">
                      <img src="/dashboard-icons/arrow-down-right.svg" alt="" />
                      12.5%
                    </span>
                    <span className="currency">-45,700</span>
                  </div>
                  <p>KES 160,890</p>
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
                      {balanceAmountVisible ? BALANCE_CARD_AMOUNT_LABEL : maskBalanceAmountLabel(BALANCE_CARD_AMOUNT_LABEL)}
                    </strong>
                    <span className="trend positive">
                      <img src="/dashboard-icons/arrow-up-right.svg" alt="" />
                      15.8%
                    </span>
                    <small>Compared to last month</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="balanceBody">
              <div className="chartPane">
                <div className="legend">
                  {BALANCE_SLICES.map((slice) => (
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
                        data={[BALANCE_SLICES[0]]}
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
                        fill={BALANCE_SLICES[0].color}
                        stroke="#ffffff"
                        strokeWidth={5}
                        onMouseEnter={() => setActiveSliceIndex(0)}
                        onMouseLeave={() => setActiveSliceIndex(null)}
                      />
                      <Pie
                        data={[BALANCE_SLICES[1]]}
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
                        fill={BALANCE_SLICES[1].color}
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
                    {formatKes(BALANCE_SLICES[0].value)}
                  </span>
                  <span
                    className="donutLabel right"
                    style={{
                      left: expenditureLabelPosition ? `${expenditureLabelPosition.x}px` : undefined,
                      top: expenditureLabelPosition ? `${expenditureLabelPosition.y}px` : undefined,
                      opacity: expenditureLabelPosition ? 1 : 0,
                    }}
                  >
                    {formatKes(BALANCE_SLICES[1].value)}
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
                      {TRANSACTIONS.map((row) => (
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
