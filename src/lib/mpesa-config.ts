/**
 * M-Pesa client wiring (browser-safe: no secrets, no `MPESA_*` env reads here).
 *
 * Daraja credentials and `loadMpesaServerConfig()` live under `server/lib/mpesa-config.ts`
 * and are only loaded by the Node API process so Consumer Secret and Security Credential
 * never ship to the browser bundle.
 */

export const mpesaClientRoutes = {
  disburse: '/api/mpesa/disburse',
  balance: '/api/mpesa/balance',
  accountBalanceWebhook: '/api/mpesa/webhooks/account-balance',
  status: (disbursementId: string) =>
    `/api/mpesa/status/${encodeURIComponent(disbursementId)}`,
} as const
