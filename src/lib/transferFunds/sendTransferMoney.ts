import type { AppMode } from '../appMode'
import { DEMO_MPESA_TRANSFER_ID } from '../appMode'
import { api } from '../api'
import { mpesaClientRoutes } from '../mpesa-config'
import { parseTransferAmountInput, type TransferFundsReviewState } from './transferModel'

export type SendTransferMoneyResult =
  | { ok: true; id: string }
  | { ok: false; message: string }

/**
 * Demo: simulated success (no server). Live: Prisma + Daraja B2C on the server only.
 */
export async function sendTransferMoney(
  draft: TransferFundsReviewState,
  appMode: AppMode,
): Promise<SendTransferMoneyResult> {
  const amount = parseTransferAmountInput(draft.amount)
  if (amount == null) {
    return { ok: false, message: 'Enter a valid amount.' }
  }

  if (appMode === 'demo') {
    await new Promise((r) => setTimeout(r, 1600))
    return { ok: true, id: DEMO_MPESA_TRANSFER_ID }
  }

  const res = await api.post<{ id?: string; message?: string }>(mpesaClientRoutes.disburse, {
    phone: draft.phone.trim(),
    amount,
    categoryId: draft.categoryId,
  })

  if (!res.success) {
    return { ok: false, message: typeof res.message === 'string' ? res.message : 'Transfer could not be started.' }
  }

  const id = typeof res.id === 'string' ? res.id : undefined
  if (!id) {
    return { ok: false, message: 'Server did not return a transfer reference.' }
  }

  return { ok: true, id }
}
