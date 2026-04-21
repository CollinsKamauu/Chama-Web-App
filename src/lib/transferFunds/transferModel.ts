/** B2C payments to registered users — fee from Total column (inclusive min/max). */
const B2C_REGISTERED_USER_TARIFFS: { min: number; max: number; fee: number }[] = [
  { min: 1, max: 49, fee: 0 },
  { min: 50, max: 100, fee: 0 },
  { min: 101, max: 500, fee: 5 },
  { min: 501, max: 1_000, fee: 5 },
  { min: 1_001, max: 1_500, fee: 5 },
  { min: 1_501, max: 2_500, fee: 9 },
  { min: 2_501, max: 3_500, fee: 9 },
  { min: 3_501, max: 5_000, fee: 9 },
  { min: 5_001, max: 7_500, fee: 11 },
  { min: 7_501, max: 10_000, fee: 11 },
  { min: 10_001, max: 15_000, fee: 11 },
  { min: 15_001, max: 20_000, fee: 11 },
  { min: 20_001, max: 25_000, fee: 13 },
  { min: 25_001, max: 30_000, fee: 13 },
  { min: 30_001, max: 35_000, fee: 13 },
  { min: 35_001, max: 40_000, fee: 13 },
  { min: 40_001, max: 45_000, fee: 13 },
  { min: 45_001, max: 50_000, fee: 13 },
  { min: 50_001, max: 70_000, fee: 13 },
  { min: 70_001, max: 250_000, fee: 13 },
]

export function b2cRegisteredUserTransferFee(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0
  if (amount < 1) return 0
  if (amount > 250_000) return 13
  for (const row of B2C_REGISTERED_USER_TARIFFS) {
    if (amount >= row.min && amount <= row.max) return row.fee
  }
  return 13
}

export const TRANSFER_CATEGORIES: { id: string; label: string; pillClass: string }[] = [
  { id: 'benevolent', label: 'Benevolent', pillClass: 'transferFundsCatPill--benevolent' },
  { id: 'event', label: 'Event', pillClass: 'transferFundsCatPill--event' },
  { id: 'service', label: 'Service provider', pillClass: 'transferFundsCatPill--service' },
  { id: 'disbursement', label: 'Disbursement', pillClass: 'transferFundsCatPill--disbursement' },
  { id: 'misc', label: 'Miscellaneous', pillClass: 'transferFundsCatPill--misc' },
]

export type TransferFundsReviewState = {
  phone: string
  amount: string
  categoryId: string | null
}

export function parseTransferAmountInput(amount: string): number | null {
  const n = Number(amount.replace(/,/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}
