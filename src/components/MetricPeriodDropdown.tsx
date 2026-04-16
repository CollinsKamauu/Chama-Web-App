import { useEffect, useRef, useState } from 'react'

export type MetricPeriod = 'today' | 'last7' | 'monthly' | 'allTime'

export const METRIC_PERIOD_OPTIONS: MetricPeriod[] = ['today', 'last7', 'monthly']

/** Includes every period option (e.g. Contributions report). */
export const METRIC_PERIOD_OPTIONS_WITH_ALL_TIME: MetricPeriod[] = [...METRIC_PERIOD_OPTIONS, 'allTime']

export const METRIC_PERIOD_LABEL: Record<MetricPeriod, string> = {
  today: 'Today',
  last7: 'Last 7 days',
  monthly: 'Monthly',
  allTime: 'All-time',
}

/** Primary chip text: day for Today, month name for Monthly, rolling 7-day range for Last 7 days. */
export function formatMetricPrimaryLabel(period: MetricPeriod, refDate = new Date()): string {
  if (period === 'allTime') {
    return 'All time'
  }
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

export type MetricPeriodDropdownProps = {
  period: MetricPeriod
  onPeriodChange: (next: MetricPeriod) => void
  menuId: string
  /** `page` uses top-bar styling (34px, joined chips); default matches metric cards. */
  variant?: 'metric' | 'page'
  /** Override option labels (e.g. map last7 to "Weekly" on Contributions). */
  periodLabelOverrides?: Partial<Record<MetricPeriod, string>>
  /** Menu entries; defaults to Today / Last 7 days / Monthly only. */
  periodOptions?: MetricPeriod[]
}

export function MetricPeriodDropdown({
  period,
  onPeriodChange,
  menuId,
  variant = 'metric',
  periodLabelOverrides,
  periodOptions,
}: MetricPeriodDropdownProps) {
  const [open, setOpen] = useState(false)
  const triggerWrapRef = useRef<HTMLDivElement>(null)
  const primaryLabel = formatMetricPrimaryLabel(period)
  const menuOptions = periodOptions ?? METRIC_PERIOD_OPTIONS

  const optionLabel = (p: MetricPeriod) => periodLabelOverrides?.[p] ?? METRIC_PERIOD_LABEL[p]

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
  const staticClass = variant === 'page' ? 'topDateChip dateChipStatic' : 'dateChip dateChipStatic'

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
          {optionLabel(period)}
          <img src="/dashboard-icons/chevron-down.svg" alt="" />
        </button>
        {open ? (
          <ul className="metricPeriodMenu" id={menuId} role="listbox" aria-labelledby={`${menuId}-trigger`}>
            {menuOptions.map((opt) => (
              <li key={opt} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={period === opt}
                  className={period === opt ? 'isActive' : undefined}
                  onClick={() => select(opt)}
                >
                  {optionLabel(opt)}
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
