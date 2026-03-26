import { Router, Request, Response } from 'express'
import axios from 'axios'

// Optional: import your DB service here
// import { saveTransaction } from '../services/transactionService'

const router = Router()

// ─── Daraja Sandbox Credentials ───────────────────────────────────────────────
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || ''
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || ''
const SHORTCODE = process.env.MPESA_SHORTCODE || '600999'
const PASSKEY = process.env.MPESA_PASSKEY || ''
const STK_CALLBACK_URL = process.env.MPESA_STK_CALLBACK_URL || 'https://milestone-chama-backend.onrender.com/mpesa/stkpush/callback'

const DARAJA_BASE_URL = 'https://sandbox.safaricom.co.ke'

// ─── Helper: Get OAuth Access Token ───────────────────────────────────────────
async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')
  const response = await axios.get(
    `${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${credentials}` } }
  )
  return response.data.access_token
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
 *
 * Mount this router in app.ts/server.ts with:
 *   app.use('/mpesa', mpesaRouter)
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

    const response = await axios.post(
      `${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    console.log('STK Push initiated:', response.data)

    return res.json({
      success: true,
      checkoutRequestId: response.data.CheckoutRequestID,
      merchantRequestId: response.data.MerchantRequestID,
      responseDescription: response.data.ResponseDescription,
    })
  } catch (error: any) {
    console.error('STK Push error:', error?.response?.data || error.message)
    return res.status(500).json({
      success: false,
      message: error?.response?.data?.errorMessage || 'STK Push failed',
    })
  }
})

// ─── STK Push: Callback ────────────────────────────────────────────────────────
/**
 * POST /mpesa/stkpush/callback
 *
 * Safaricom calls this URL after the customer completes or cancels the
 * STK Push prompt. Use this to confirm the payment and update your DB.
 *
 * Success payload key fields:
 *   - Body.stkCallback.ResultCode: 0 means success
 *   - Body.stkCallback.CallbackMetadata.Item: array of { Name, Value } pairs
 *     containing Amount, MpesaReceiptNumber, PhoneNumber, TransactionDate
 *
 * Failure payload:
 *   - Body.stkCallback.ResultCode: non-zero (e.g. 1032 = cancelled by user)
 *   - Body.stkCallback.ResultDesc: human-readable reason
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
    // Payment was successful
    const items: { Name: string; Value: any }[] = CallbackMetadata?.Item || []
    const get = (name: string) => items.find((i) => i.Name === name)?.Value

    const amount = get('Amount')
    const receiptNumber = get('MpesaReceiptNumber')
    const phone = get('PhoneNumber')
    const transactionDate = get('TransactionDate')

    console.log('Payment confirmed:', { amount, receiptNumber, phone, transactionDate })

    // TODO: Save the transaction to your database here
    // Example:
    // await saveTransaction({
    //   checkoutRequestId: CheckoutRequestID,
    //   receiptNumber,
    //   amount,
    //   phone,
    //   transactionDate,
    // })
  } else {
    // Payment failed or was cancelled
    console.warn(`STK Push failed: [${ResultCode}] ${ResultDesc}`)

    // TODO: Update transaction status in DB to 'failed' or 'cancelled'
    // await updateTransactionStatus(CheckoutRequestID, 'failed', ResultDesc)
  }

  // Always respond with 200 to acknowledge receipt
  return res.json({ ResultCode: 0, ResultDesc: 'Accepted' })
})

// ─── C2B: Validation ──────────────────────────────────────────────────────────
/**
 * POST /validation
 *
 * Safaricom calls this URL BEFORE completing a C2B payment.
 * Respond within a few seconds or Safaricom will auto-reject.
 *
 * To ACCEPT: respond with ResultCode: 0
 * To REJECT: respond with ResultCode: "C2B00011"
 *
 * NOTE: Mount this router at app.use('/', mpesaRouter) for /validation
 * and /confirmation to be reachable at root level.
 */
router.post('/validation', (req: Request, res: Response) => {
  const payload = req.body
  console.log('M-Pesa C2B validation callback received:', payload)

  // Optional: Add validation logic here
  // const isValid = await validateAccount(payload.BillRefNumber)
  // if (!isValid) return res.json({ ResultCode: 'C2B00011', ResultDesc: 'Rejected' })

  res.json({ ResultCode: 0, ResultDesc: 'Accepted' })
})

// ─── C2B: Confirmation ────────────────────────────────────────────────────────
/**
 * POST /confirmation
 *
 * Safaricom calls this URL AFTER a C2B payment is completed.
 * The money has moved — record it in your database.
 */
router.post('/confirmation', async (req: Request, res: Response) => {
  const payload = req.body
  console.log('M-Pesa C2B confirmation callback received:', payload)

  try {
    // TODO: Save the transaction to your database here
    // await saveTransaction({
    //   transactionId: payload.TransID,
    //   amount: parseFloat(payload.TransAmount),
    //   phone: payload.MSISDN,
    //   accountRef: payload.BillRefNumber,
    //   timestamp: payload.TransTime,
    //   shortCode: payload.BusinessShortCode,
    // })

    res.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  } catch (error) {
    console.error('Error processing M-Pesa confirmation:', error)
    // Always respond 0 to prevent Safaricom from retrying
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }
})

export default router
