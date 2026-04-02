import { PrismaClient } from '@prisma/client'

// Re-use a single PrismaClient instance across the app (prevents connection pool exhaustion)
declare global {
  var __prisma: PrismaClient | undefined
}

export const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type C2BPayload = {
  TransID: string
  TransAmount: string | number
  MSISDN: string
  BillRefNumber: string
  TransTime: string
  FirstName?: string
  LastName?: string
  BusinessShortCode?: string
}

export type STKPayload = {
  checkoutRequestId: string
  receiptNumber: string
  amount: number
  phone: string
  transactionDate: string | number
}

export type TransactionRecord = {
  id: string
  transId: string
  transAmount: number
  msisdn: string
  billRefNumber: string
  transTime: string
  firstName: string
  lastName: string
  businessShortCode: string
  transType: string
  createdAt: Date
}

// ─── Save C2B Confirmation Transaction ────────────────────────────────────────

/**
 * Saves a C2B confirmation callback payload to the database.
 * Called from POST /confirmation in mpesa.ts.
 * Uses upsert to safely handle duplicate callbacks from Safaricom.
 */
export async function saveC2BTransaction(payload: C2BPayload): Promise<TransactionRecord> {
  const record = await prisma.transaction.upsert({
    where: { transId: payload.TransID },
    update: {}, // If already exists, do nothing (idempotent)
    create: {
      transId: payload.TransID,
      transAmount: parseFloat(String(payload.TransAmount)),
      msisdn: String(payload.MSISDN),
      billRefNumber: payload.BillRefNumber ?? '',
      transTime: String(payload.TransTime),
      firstName: payload.FirstName ?? '',
      lastName: payload.LastName ?? '',
      businessShortCode: payload.BusinessShortCode ?? '',
      transType: 'C2B',
    },
  })

  return record
}

// ─── Save STK Push Transaction ─────────────────────────────────────────────────

/**
 * Saves an STK Push callback payload to the database.
 * Called from POST /mpesa/stkpush/callback in mpesa.ts.
 * Uses upsert to safely handle duplicate callbacks from Safaricom.
 */
export async function saveSTKTransaction(payload: STKPayload): Promise<TransactionRecord> {
  const record = await prisma.transaction.upsert({
    where: { transId: payload.receiptNumber },
    update: {},
    create: {
      transId: payload.receiptNumber,
      transAmount: payload.amount,
      msisdn: String(payload.phone),
      billRefNumber: '',
      transTime: String(payload.transactionDate),
      firstName: '',
      lastName: '',
      businessShortCode: '',
      transType: 'STKPush',
    },
  })

  return record
}

// ─── Fetch All Transactions ────────────────────────────────────────────────────

/**
 * Returns all transactions ordered by most recent first.
 * Called from GET /api/payments.
 */
export async function getAllTransactions(): Promise<TransactionRecord[]> {
  return prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
  })
}
