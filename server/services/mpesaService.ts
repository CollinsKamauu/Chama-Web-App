import ky, { HTTPError } from 'ky'
import { getDarajaBaseUrl, loadMpesaServerConfig, type MpesaServerConfig } from '../lib/mpesa-config.js'
import { describeMpesaResultCode } from './mpesaResultCodes.js'

const OAUTH_TIMEOUT_MS = 30_000
const API_TIMEOUT_MS = 60_000

type TokenCache = { token: string; expiresAtMs: number }
let tokenCache: TokenCache | null = null

function darajaBase(config: MpesaServerConfig): string {
  return getDarajaBaseUrl(config.environment)
}

/**
 * Fetches an OAuth access token, reusing a cached token until ~5 minutes before expiry (tokens last ~1 hour).
 */
export async function getMpesaAccessToken(config: MpesaServerConfig): Promise<string> {
  const now = Date.now()
  if (tokenCache && now < tokenCache.expiresAtMs - 5 * 60_000) {
    return tokenCache.token
  }

  const credentials = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64')
  const data = await ky
    .get(`${darajaBase(config)}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${credentials}` },
      timeout: OAUTH_TIMEOUT_MS,
      retry: { limit: 0 },
    })
    .json<{ access_token: string; expires_in?: string | number }>()

  const expiresInSec = Number(data.expires_in ?? 3600)
  const safeMs = (Number.isFinite(expiresInSec) ? expiresInSec : 3600) * 1000
  tokenCache = { token: data.access_token, expiresAtMs: now + safeMs }
  return data.access_token
}

export type B2cSendMoneyInput = {
  partyBMsisdn254: string
  amountKes: number
  remarks: string
  occasion?: string
}

export type B2cSendMoneyResult =
  | {
      ok: true
      conversationId: string | null
      originatorConversationId: string | null
      responseCode: string | null
      responseDescription: string | null
      raw: unknown
    }
  | {
      ok: false
      error: string
      responseCode?: string | null
      raw?: unknown
    }

/**
 * B2C BusinessPayment to a registered M-Pesa customer (PartyB).
 * Production URL: https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest
 */
export async function sendMoney(input: B2cSendMoneyInput): Promise<B2cSendMoneyResult> {
  const config = loadMpesaServerConfig()
  const token = await getMpesaAccessToken(config)
  const base = darajaBase(config)
  const url = `${base}/mpesa/b2c/v1/paymentrequest`

  const amountInt = Math.floor(input.amountKes)
  if (amountInt < 1) {
    return { ok: false, error: 'Amount must be at least KES 1.' }
  }

  const payload = {
    InitiatorName: config.initiatorName,
    SecurityCredential: config.securityCredential,
    CommandID: 'BusinessPayment',
    Amount: String(amountInt),
    PartyA: config.b2cShortcode,
    PartyB: input.partyBMsisdn254,
    Remarks: input.remarks.slice(0, 100),
    QueueTimeOutURL: config.b2cQueueTimeoutUrl,
    ResultURL: config.b2cResultUrl,
    Occasion: (input.occasion ?? 'Transfer').slice(0, 100),
  }

  try {
    const raw = await ky
      .post(url, {
        headers: { Authorization: `Bearer ${token}` },
        json: payload,
        timeout: API_TIMEOUT_MS,
        retry: { limit: 0 },
      })
      .json<{
        ConversationID?: string
        OriginatorConversationID?: string
        ResponseCode?: string
        ResponseDescription?: string
      }>()

    const responseCode = raw.ResponseCode != null ? String(raw.ResponseCode) : null
    const ok = responseCode === '0'

    if (!ok) {
      const desc =
        raw.ResponseDescription ??
        describeMpesaResultCode(responseCode) ??
        'B2C request was rejected by Safaricom.'
      return {
        ok: false,
        error: desc,
        responseCode,
        raw,
      }
    }

    return {
      ok: true,
      conversationId: raw.ConversationID ?? null,
      originatorConversationId: raw.OriginatorConversationID ?? null,
      responseCode,
      responseDescription: raw.ResponseDescription ?? null,
      raw,
    }
  } catch (err: unknown) {
    return { ok: false, error: await formatKyError(err), raw: err }
  }
}

export type AccountBalanceInitResult =
  | { ok: true; originatorConversationId: string | null; conversationId: string | null; raw: unknown }
  | { ok: false; error: string; raw?: unknown }

/**
 * Initiates working-account balance query (final balance is delivered to ResultURL asynchronously).
 */
export async function getAccountBalance(): Promise<AccountBalanceInitResult> {
  const config = loadMpesaServerConfig()
  const token = await getMpesaAccessToken(config)
  const base = darajaBase(config)

  const payload = {
    Initiator: config.initiatorName,
    SecurityCredential: config.securityCredential,
    CommandID: 'AccountBalance',
    PartyA: config.b2cShortcode,
    IdentifierType: '4',
    Remarks: 'Balance',
    QueueTimeOutURL: config.accountBalanceQueueTimeoutUrl,
    ResultURL: config.accountBalanceResultUrl,
  }

  try {
    const raw = await ky
      .post(`${base}/mpesa/accountbalance/v1/query`, {
        headers: { Authorization: `Bearer ${token}` },
        json: payload,
        timeout: API_TIMEOUT_MS,
        retry: { limit: 0 },
      })
      .json<{
        OriginatorConversationID?: string
        ConversationID?: string
        ResponseCode?: string
        ResponseDescription?: string
      }>()

    const code = raw.ResponseCode != null ? String(raw.ResponseCode) : '0'
    if (code !== '0') {
      return {
        ok: false,
        error: raw.ResponseDescription ?? describeMpesaResultCode(code) ?? 'Account balance request failed.',
        raw,
      }
    }

    return {
      ok: true,
      originatorConversationId: raw.OriginatorConversationID ?? null,
      conversationId: raw.ConversationID ?? null,
      raw,
    }
  } catch (err: unknown) {
    return { ok: false, error: await formatKyError(err), raw: err }
  }
}

export type TransactionStatusResult =
  | {
      ok: true
      resultCode: string | null
      resultDesc: string | null
      conversationId: string | null
      originatorConversationId: string | null
      raw: unknown
    }
  | { ok: false; error: string; raw?: unknown }

/**
 * Query transaction / B2C status using OriginatorConversationID (and optional TransactionID).
 */
export async function checkTransactionStatus(params: {
  originatorConversationId: string
  transactionId?: string
}): Promise<TransactionStatusResult> {
  const config = loadMpesaServerConfig()
  const token = await getMpesaAccessToken(config)
  const base = darajaBase(config)

  const payload = {
    Initiator: config.initiatorName,
    SecurityCredential: config.securityCredential,
    CommandID: 'TransactionStatusQuery',
    TransactionID: params.transactionId ?? '',
    PartyA: config.b2cShortcode,
    IdentifierType: '4',
    ResultURL: config.transactionStatusResultUrl,
    QueueTimeOutURL: config.transactionStatusQueueTimeoutUrl,
    Remarks: 'Status',
    Occasion: 'Transfer',
    OriginatorConversationID: params.originatorConversationId,
  }

  try {
    const raw = await ky
      .post(`${base}/mpesa/transactionstatus/v1/query`, {
        headers: { Authorization: `Bearer ${token}` },
        json: payload,
        timeout: API_TIMEOUT_MS,
        retry: { limit: 0 },
      })
      .json<Record<string, unknown>>()

    const resultBlock = (raw.Result as Record<string, unknown> | undefined) ?? raw
    const resultCode =
      resultBlock.ResultCode != null
        ? String(resultBlock.ResultCode)
        : raw.ResponseCode != null
          ? String(raw.ResponseCode)
          : null
    const resultDesc =
      (resultBlock.ResultDesc != null ? String(resultBlock.ResultDesc) : null) ??
      (raw.ResponseDescription != null ? String(raw.ResponseDescription) : null)

    return {
      ok: true,
      resultCode,
      resultDesc,
      conversationId: raw.ConversationID != null ? String(raw.ConversationID) : null,
      originatorConversationId:
        raw.OriginatorConversationID != null ? String(raw.OriginatorConversationID) : null,
      raw,
    }
  } catch (err: unknown) {
    return { ok: false, error: await formatKyError(err), raw: err }
  }
}

async function formatKyError(error: unknown): Promise<string> {
  if (error instanceof HTTPError) {
    const text = await error.response.text()
    try {
      const parsed = JSON.parse(text) as { errorMessage?: string; error?: string; ResponseDescription?: string }
      return (
        parsed.errorMessage ??
        parsed.ResponseDescription ??
        parsed.error ??
        `HTTP ${error.response.status}`
      )
    } catch {
      return text.slice(0, 400) || `HTTP ${error.response.status}`
    }
  }
  if (error instanceof Error) return error.message
  return String(error)
}
