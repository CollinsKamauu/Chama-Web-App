import { type MouseEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Pie, PieChart, ResponsiveContainer } from 'recharts'
import { useAuth } from '../context/AuthContext'
import '../App.css'

type SidebarItem = {
  icon: string
  label: string
  active?: boolean
}

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

const SIDEBAR_MAIN_ITEMS: SidebarItem[] = [
  {
    icon: '/dashboard-icons/Dashboard Active.svg',
    label: 'Dashboard',
    active: true,
  },
  {
    icon: '/dashboard-icons/Contributions Inactive.svg',
    label: 'Contributions',
  },
  {
    icon: '/dashboard-icons/Members Inactive.svg',
    label: 'Members',
  },
  {
    icon: '/dashboard-icons/Finances Inactive.svg',
    label: 'Finances',
  },
  {
    icon: '/dashboard-icons/Fund Transfer Inactive.svg',
    label: 'Transfer Funds',
  },
]

const SIDEBAR_SUPPORT_ITEMS: SidebarItem[] = [
  {
    icon: '/dashboard-icons/Settings Inactive.svg',
    label: 'Settings',
  },
  {
    icon: '/dashboard-icons/Invite Code.svg',
    label: 'Create Invite Code',
  },
  {
    icon: '/dashboard-icons/Sign Out Inactive 1.svg',
    label: 'Log out',
  },
]

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

type MetricPeriod = 'today' | 'last7' | 'monthly'

const METRIC_PERIOD_OPTIONS: MetricPeriod[] = ['today', 'last7', 'monthly']

const METRIC_PERIOD_LABEL: Record<MetricPeriod, string> = {
  today: 'Today',
  last7: 'Last 7 days',
  monthly: 'Monthly',
}

/** Primary chip text: day for Today, month name for Monthly, rolling 7-day range for Last 7 days. */
function formatMetricPrimaryLabel(period: MetricPeriod, refDate = new Date()): string {
  if (period === 'today') {
    const weekday = refDate.toLocaleDateString('en-GB', { weekday: 'short' })
    const day = refDate.getDate()
    return `${weekday} ${day}`
  }
  if (period === 'monthly') {
    return refDate.toLocaleDateString('en-GB', { month: 'long' })
  }
  const end = new Date(refDate)
  const start = new Date(refDate)
  start.setDate(start.getDate() - 6)
  const sameMonth =
    start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
  if (sameMonth) {
    const month = end.toLocaleDateString('en-GB', { month: 'long' })
    return `${start.getDate()}-${end.getDate()} ${month}`
  }
  const startPart = `${start.getDate()} ${start.toLocaleDateString('en-GB', { month: 'short' })}`
  const endPart = `${end.getDate()} ${end.toLocaleDateString('en-GB', { month: 'short' })}`
  return `${startPart} – ${endPart}`
}

type MetricPeriodDropdownProps = {
  period: MetricPeriod
  onPeriodChange: (next: MetricPeriod) => void
  menuId: string
  /** `page` uses top-bar styling (34px, joined chips); default matches metric cards. */
  variant?: 'metric' | 'page'
}

function MetricPeriodDropdown({
  period,
  onPeriodChange,
  menuId,
  variant = 'metric',
}: MetricPeriodDropdownProps) {
  const [open, setOpen] = useState(false)
  const triggerWrapRef = useRef<HTMLDivElement>(null)
  const primaryLabel = formatMetricPrimaryLabel(period)

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (e: PointerEvent) => {
      const el = triggerWrapRef.current
      if (el && !el.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const select = (next: MetricPeriod) => {
    onPeriodChange(next)
    setOpen(false)
  }

  const chipClass = variant === 'page' ? 'topDateChip' : 'dateChip'
  const staticClass =
    variant === 'page' ? 'topDateChip dateChipStatic' : 'dateChip dateChipStatic'

  const inner = (
    <>
      <span className={staticClass} aria-live="polite">
        <img src="/dashboard-icons/calendar.svg" alt="" />
        {primaryLabel}
      </span>
      <div ref={triggerWrapRef} className="metricPeriodTriggerWrap">
        <button
          type="button"
          className={chipClass}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={menuId}
          id={`${menuId}-trigger`}
          onClick={() => setOpen((v) => !v)}
        >
          {METRIC_PERIOD_LABEL[period]}
          <img src="/dashboard-icons/chevron-down.svg" alt="" />
        </button>
        {open ? (
          <ul
            className="metricPeriodMenu"
            id={menuId}
            role="listbox"
            aria-labelledby={`${menuId}-trigger`}
          >
            {METRIC_PERIOD_OPTIONS.map((opt) => (
              <li key={opt} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={period === opt}
                  className={period === opt ? 'isActive' : undefined}
                  onClick={() => select(opt)}
                >
                  {METRIC_PERIOD_LABEL[opt]}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </>
  )

  if (variant === 'page') {
    return <div className="pageFilterPeriodGroup">{inner}</div>
  }

  return inner
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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

  useEffect(() => {
    if (!mobileMenuOpen) return undefined
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileMenuOpen])

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
    <div className="dashboardPage">
      <aside className="dashboardSidebar">
        <div className="sidebarBrand">
          <img src="/dashboard-icons/Chama App Demo Logo.svg" alt="Chama App" />
          <span>Chama App</span>
        </div>

        <div className="sidebarSection">
          <span className="sectionLabel">GENERAL</span>
          <nav className="menuList">
            {SIDEBAR_MAIN_ITEMS.map((item) => (
              <button key={item.label} type="button" className={`menuItem ${item.active ? 'active' : ''}`}>
                <img src={item.icon} alt="" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebarSection support">
          <span className="sectionLabel">SUPPORT</span>
          <nav className="menuList">
            {SIDEBAR_SUPPORT_ITEMS.map((item) => (
              <button
                key={item.label}
                type="button"
                className="menuItem"
                onClick={item.label === 'Log out' ? handleLogout : undefined}
              >
                <img src={item.icon} alt="" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <section className="dashboardMain">
        <header className="mainHeader">
          <div className="mobileHeaderBrand">
            <Link className="mobileBrand" to="/" aria-label="Go to homepage">
              <img src="/dashboard-icons/Chama App Demo Logo.svg" alt="Chama App" />
              <span>Chama App</span>
            </Link>
            <button
              type="button"
              className="mobileMenuButton"
              aria-label="Open navigation"
              aria-haspopup="menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(true)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M4 6h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <h1>Milestone Fraternity</h1>
          <div className="searchWrap">
            <img src="/dashboard-icons/search.svg" alt="" />
            <input type="text" placeholder="Search" />
          </div>
          <div className="userInfo">
            <img className="userAvatar" src="/dashboard-icons/Account.svg" alt="" aria-hidden="true" />
            <div>
              <p className="userName">{profileName}</p>
              <p className="userRole">Treasurer</p>
            </div>
          </div>
        </header>

        {mobileMenuOpen ? (
          <div className="mobileMenuOverlay" role="presentation">
            <button
              type="button"
              className="mobileMenuBackdrop"
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="mobileMenuPanel" role="menu" aria-label="Mobile menu">
              <div className="mobileMenuHeader">
                <Link
                  className="mobileBrand"
                  to="/"
                  aria-label="Go to homepage"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <img src="/dashboard-icons/Chama App Demo Logo.svg" alt="Chama App" />
                  <span>Chama App</span>
                </Link>
                <button
                  type="button"
                  className="mobileMenuClose"
                  aria-label="Close menu"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ×
                </button>
              </div>
              <div className="mobileMenuItems">
                <button
                  type="button"
                  className="mobileMenuItem"
                  role="menuitem"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <img src="/dashboard-icons/Settings Inactive.svg" alt="" aria-hidden="true" />
                  <span>Settings</span>
                </button>
                <button
                  type="button"
                  className="mobileMenuItem"
                  role="menuitem"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <img src="/dashboard-icons/Invite Code.svg" alt="" aria-hidden="true" />
                  <span>Create Invite Code</span>
                </button>
                <button
                  type="button"
                  className="mobileMenuItem"
                  role="menuitem"
                  onClick={(e) => {
                    setMobileMenuOpen(false)
                    handleLogout(e)
                  }}
                >
                  <img src="/dashboard-icons/Sign Out Inactive 1.svg" alt="" aria-hidden="true" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}

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
              <button type="button" className="iconChip">
                <img src="/dashboard-icons/more-vertical.svg" alt="" />
              </button>
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
      </section>

      <nav className="mobileNav" aria-label="Primary navigation">
        <button type="button" className="mobileNavItem">
          <img src="/dashboard-icons/Contributions Inactive.svg" alt="" aria-hidden="true" />
          <span>Contributions</span>
        </button>
        <button type="button" className="mobileNavItem">
          <img src="/dashboard-icons/Finances Inactive.svg" alt="" aria-hidden="true" />
          <span>Finances</span>
        </button>
        <button type="button" className="mobileNavItem">
          <img src="/dashboard-icons/Fund Transfer Inactive.svg" alt="" aria-hidden="true" />
          <span>Transfer Funds</span>
        </button>
        <button type="button" className="mobileNavItem">
          <img src="/dashboard-icons/Members Inactive.svg" alt="" aria-hidden="true" />
          <span>Members</span>
        </button>
      </nav>
    </div>
  )
}
