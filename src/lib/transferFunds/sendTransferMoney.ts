import type { TransferFundsReviewState } from './transferModel'

/** Replace this implementation with the real transfer API when wired. */
export async function sendTransferMoney(_draft: TransferFundsReviewState): Promise<{ ok: boolean }> {
  await new Promise((r) => setTimeout(r, 1600))
  return { ok: true }
}
