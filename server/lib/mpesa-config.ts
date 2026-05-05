/**
 * Server-only Daraja / M-Pesa configuration (reads process.env).
 * Do not import this module from any file under `src/`.
 */

export type MpesaEnvironment = 'production' | 'sandbox'

export type MpesaServerConfig = {
  consumerKey: string
  consumerSecret: string
  initiatorName: string
  securityCredential: string
  b2cShortcode: string
  environment: MpesaEnvironment
  b2cResultUrl: string
  b2cQueueTimeoutUrl: string
  accountBalanceResultUrl: string
  accountBalanceQueueTimeoutUrl: string
  transactionStatusResultUrl: string
  transactionStatusQueueTimeoutUrl: string
  /** Optional: shown by GET /api/mpesa/balance when no callback has populated cache yet */
  workingBalanceFallbackKes: number | null
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (v == null || String(v).trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return String(v).trim()
}

function optionalEnv(name: string): string | undefined {
  const v = process.env[name]
  if (v == null || String(v).trim() === '') return undefined
  return String(v).trim()
}

function optionalPositiveNumber(name: string): number | null {
  const raw = optionalEnv(name)
  if (raw == null) return null
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : null
}

/**
 * Loads and validates M-Pesa env. Throws if required keys are missing.
 * Call inside request handlers so the API server can still boot without .env for unrelated routes.
 */
export function loadMpesaServerConfig(): MpesaServerConfig {
  const envRaw = (optionalEnv('MPESA_ENVIRONMENT') ?? 'production').toLowerCase()
  const environment: MpesaEnvironment = envRaw === 'sandbox' ? 'sandbox' : 'production'

  return {
    consumerKey: requireEnv('MPESA_CONSUMER_KEY'),
    consumerSecret: requireEnv('MPESA_CONSUMER_SECRET'),
    initiatorName: requireEnv('MPESA_INITIATOR_NAME'),
    securityCredential: requireEnv('MPESA_SECURITY_CREDENTIAL'),
    b2cShortcode: requireEnv('MPESA_B2C_SHORTCODE'),
    environment,
    b2cResultUrl: requireEnv('MPESA_B2C_RESULT_URL'),
    b2cQueueTimeoutUrl: requireEnv('MPESA_B2C_QUEUE_TIMEOUT_URL'),
    accountBalanceResultUrl: requireEnv('MPESA_ACCOUNT_BALANCE_RESULT_URL'),
    accountBalanceQueueTimeoutUrl: requireEnv('MPESA_ACCOUNT_BALANCE_QUEUE_TIMEOUT_URL'),
    transactionStatusResultUrl: requireEnv('MPESA_TRANSACTION_STATUS_RESULT_URL'),
    transactionStatusQueueTimeoutUrl: requireEnv('MPESA_TRANSACTION_STATUS_QUEUE_TIMEOUT_URL'),
    workingBalanceFallbackKes: optionalPositiveNumber('MPESA_WORKING_BALANCE_FALLBACK_KES'),
  }
}

export function getDarajaBaseUrl(environment: MpesaEnvironment): string {
  return environment === 'sandbox' ? 'https://sandbox.safaricom.co.ke' : 'https://api.safaricom.co.ke'
}
