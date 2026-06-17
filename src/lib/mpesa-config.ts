/**
 * M-Pesa client routes (browser-safe: no secrets).
 * All calls go to the production backend via `/api/mpesa/*`.
 */

export const mpesaClientRoutes = {
  disburse: '/api/mpesa/disburse',
  balance: '/api/mpesa/balance',
  accountBalanceWebhook: '/api/mpesa/webhooks/account-balance',
  status: (disbursementId: string) =>
    `/api/mpesa/status/${encodeURIComponent(disbursementId)}`,
} as const
