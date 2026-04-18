/** Expenditure categories (aligned with backend / reporting). */
export const EXPENDITURE_TYPES = [
  'Benevolent',
  'Event',
  'Disbursement',
  'Miscellaneous',
  'Bill',
  'Service Provider',
] as const

export type ExpenditureType = (typeof EXPENDITURE_TYPES)[number]

export type ExpenditureRow = {
  id: string
  transactionId: string
  date: string
  name: string
  phone: string
  type: ExpenditureType
  amount: number
}

export type BalanceSummary = {
  totalIncome: number
  totalExpenses: number
  netBalance: number
  /** Shown as "Date: …" on the fund balance statement (e.g. April 20, 2026). */
  statementDateLabel: string
}
