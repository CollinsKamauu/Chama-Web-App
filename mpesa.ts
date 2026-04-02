import { Router, Request, Response } from 'express'
import ky, { HTTPError } from 'ky'
import { saveC2BTransaction, saveSTKTransaction } from './src/services/transactionService'

const router = Router()

// ─── Daraja Sandbox Credentials ───────────────────────────────────────────────
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || ''
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || ''
const SHORTCODE = process.env.MPESA_SHORTCODE || '600999'
const PASSKEY = process.env.MPESA_PASSKEY || ''
const STK_CALLBACK_URL = process.env.MPESA_STK_CALLBACK_URL || 'https://milestone-chama-backend.onrender.com/mpesa/stkpush/callback'

const DARAJA_BASE_URL = 'https://sandbox.safaricom.co.ke'

/** Bounded timeouts reduce DoS from hung upstream; no retries on token/STK to avoid duplicate side effects. */
const OAUTH_TIMEOUT_MS = 30_000
const STK_TIMEOUT_MS = 60_000

async function readKyHttpErrorBody(error: unknown): Promise<{ log: unknown; clientMessage: string }> {
  if (error instanceof HTTPError) {
    const text = await error.response.text()
    try {
      const parsed = JSON.parse(text) as { errorMessage?: string; error?: string }
      return {
        log: parsed,
        clientMessage: parsed.errorMessage ?? parsed.error ?? 'Request failed',
      }
    } catch {
      return { log: text.slice(0, 500), clientMessage: 'Request failed' }
    }
  }
  if (error instanceof Error) {
    return { log: error.message, clientMessage: 'Request failed' }
  }
  return { log: String(error), clientMessage: 'Request failed' }
}

// ─── Helper: Get OAuth Access Token ───────────────────────────────────────────
async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')
  const data = await ky
    .get(`${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${credentials}` },
      timeout: OAUTH_TIMEOUT_MS,
      retry: { limit: 0 },
    })
    .json<{ access_token: string }>()
  return data.access_token
}

// ─── Helper: Generate STK Push Password ───────────────────────────────────────
function generatePassword(): { password: string; timestamp: string } {
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, '')
    .slice(0, 14)
  const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64')
  return { password, timestamp }
}

// ─── STK Push: Initiate Payment ───────────────────────────────────────────────
/**
 * POST /mpesa/stkpush
 *
 * Called by the frontend to trigger an M-Pesa STK Push prompt on the
 * customer's phone. The customer then enters their M-Pesa PIN to complete
 * the payment.
 *
 * Request body:
 *   - phone: string   — customer phone number in format 2547XXXXXXXX
 *   - amount: number  — amount to charge (minimum 1)
 *   - accountRef: string — account reference (e.g. "ChamaContribution")
 */
router.post('/stkpush', async (req: Request, res: Response) => {
  const { phone, amount, accountRef } = req.body

  if (!phone || !amount || !accountRef) {
    return res.status(400).json({ success: false, message: 'phone, amount and accountRef are required' })
  }

  try {
    const accessToken = await getAccessToken()
    const { password, timestamp } = generatePassword()

    const payload = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(amount),
      PartyA: phone,
      PartyB: SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: STK_CALLBACK_URL,
      AccountReference: accountRef,
      TransactionDesc: `Payment for ${accountRef}`,
    }

    const data = await ky
      .post(`${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        json: payload,
        timeout: STK_TIMEOUT_MS,
        retry: { limit: 0 },
      })
      .json<{
        CheckoutRequestID?: string
        MerchantRequestID?: string
        ResponseDescription?: string
      }>()

    console.log('STK Push initiated:', data)

    return res.json({
      success: true,
      checkoutRequestId: data.CheckoutRequestID,
      merchantRequestId: data.MerchantRequestID,
      responseDescription: data.ResponseDescription,
    })
  } catch (error: unknown) {
    const { log, clientMessage } = await readKyHttpErrorBody(error)
    console.error('STK Push error:', log)
    return res.status(500).json({
      success: false,
      message: clientMessage === 'Request failed' ? 'STK Push failed' : clientMessage,
    })
  }
})

// ─── STK Push: Callback ────────────────────────────────────────────────────────
/**
 * POST /mpesa/stkpush/callback
 *
 * Safaricom calls this URL after the customer completes or cancels the
 * STK Push prompt.
 */
router.post('/stkpush/callback', async (req: Request, res: Response) => {
  const callback = req.body?.Body?.stkCallback

  if (!callback) {
    console.error('Invalid STK callback payload:', req.body)
    return res.status(400).json({ success: false })
  }

  const { ResultCode, ResultDesc, CallbackMetadata, CheckoutRequestID } = callback

  console.log('STK Push callback received:', { ResultCode, ResultDesc, CheckoutRequestID })

  if (ResultCode === 0) {
    const items: { Name: string; Value: unknown }[] = CallbackMetadata?.Item || []
    const get = (name: string) => items.find((i) => i.Name === name)?.Value

    const amount = get('Amount')
    const receiptNumber = get('MpesaReceiptNumber')
    const phone = get('PhoneNumber')
    const transactionDate = get('TransactionDate')

    console.log('STK Push payment confirmed:', { amount, receiptNumber, phone, transactionDate })

    try {
      const amt = typeof amount === 'number' ? amount : parseFloat(String(amount ?? ''))
      const td = transactionDate
      const transactionDateNorm: string | number =
        typeof td === 'number' || typeof td === 'string' ? td : String(td ?? '')

      await saveSTKTransaction({
        checkoutRequestId: String(CheckoutRequestID ?? ''),
        receiptNumber: String(receiptNumber ?? ''),
        amount: Number.isFinite(amt) ? amt : 0,
        phone: String(phone ?? ''),
        transactionDate: transactionDateNorm,
      })
      console.log('STK Push transaction saved to DB:', receiptNumber)
    } catch (dbError) {
      console.error('Failed to save STK Push transaction to DB:', dbError)
    }
  } else {
    console.warn(`STK Push failed: [${ResultCode}] ${ResultDesc}`)
  }

  return res.json({ ResultCode: 0, ResultDesc: 'Accepted' })
})

// ─── C2B: Validation ──────────────────────────────────────────────────────────
/**
 * POST /validation
 *
 * Safaricom calls this URL BEFORE completing a C2B payment.
 * Respond within a few seconds or Safaricom will auto-reject.
 */
router.post('/validation', (req: Request, res: Response) => {
  const payload = req.body
  console.log('M-Pesa C2B validation callback received:', payload)
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' })
})

// ─── C2B: Confirmation ────────────────────────────────────────────────────────
/**
 * POST /confirmation
 *
 * Safaricom calls this URL AFTER a C2B payment is completed.
 * The money has moved — this is where we persist the transaction.
 */
router.post('/confirmation', async (req: Request, res: Response) => {
  const payload = req.body
  console.log('M-Pesa C2B confirmation callback received:', payload)

  try {
    const saved = await saveC2BTransaction(payload)
    console.log('C2B transaction saved to DB:', saved.transId)
  } catch (dbError) {
    console.error('Failed to save C2B transaction to DB:', dbError)
    // Still respond 0 — never let a DB error cause Safaricom to retry endlessly
  }

  res.json({ ResultCode: 0, ResultDesc: 'Accepted' })
})

export default router
