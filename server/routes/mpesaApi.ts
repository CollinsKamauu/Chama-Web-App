import { Prisma } from '@prisma/client'
import { Router } from 'express'
import { prisma } from '../transactionService.js'
import { loadMpesaServerConfig } from '../lib/mpesa-config.js'
import { normalizeMsisdn254 } from '../lib/normalizeMsisdn.js'
import { describeMpesaResultCode, isInsufficientFundsResult } from '../services/mpesaResultCodes.js'
import { checkTransactionStatus, getAccountBalance, sendMoney } from '../services/mpesaService.js'

export const mpesaApiRouter = Router()

const CACHE_ID = 'default'

function parseAccountBalanceKes(body: unknown): number | null {
  if (!body || typeof body !== 'object') return null
  const walk = (node: unknown): string | null => {
    if (node == null) return null
    if (typeof node === 'string') return node
    if (Array.isArray(node)) {
      for (const item of node) {
        const v = walk(item)
        if (v) return v
      }
      return null
    }
    if (typeof node === 'object') {
      const o = node as Record<string, unknown>
      if (typeof o.Key === 'string' && o.Key === 'AccountBalance' && o.Value != null) {
        return String(o.Value)
      }
      if (typeof o.Name === 'string' && o.Name === 'AccountBalance' && o.Value != null) {
        return String(o.Value)
      }
      for (const k of Object.keys(o)) {
        const v = walk(o[k])
        if (v) return v
      }
    }
    return null
  }

  const raw = walk(body)
  if (!raw) return null
  // Often "Utility Account|KES 123|...&Working Account|KES 456|..."
  const parts = raw.split('&')
  for (const p of parts) {
    const segs = p.split('|')
    if (segs.length >= 3 && segs[0]?.toLowerCase().includes('working')) {
      const n = Number(String(segs[1]).replace(/[^\d.]/g, ''))
      if (Number.isFinite(n)) return n
    }
  }
  const lastKes = raw.match(/KES\s*([\d,.]+)/i)
  if (lastKes) {
    const n = Number(lastKes[1].replace(/,/g, ''))
    if (Number.isFinite(n)) return n
  }
  return null
}

type DisburseBody = { phone?: string; amount?: number; categoryId?: string | null }

mpesaApiRouter.post('/disburse', async (req, res) => {
  try {
    loadMpesaServerConfig()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'M-Pesa is not configured on this server.'
    return res.status(503).json({ success: false, message: msg })
  }

  const body = req.body as DisburseBody
  const amount = typeof body.amount === 'number' ? body.amount : Number(body.amount)
  if (!body.phone || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ success: false, message: 'phone and a positive amount are required.' })
  }

  let msisdn: string
  try {
    msisdn = normalizeMsisdn254(String(body.phone))
  } catch (e) {
    return res.status(400).json({ success: false, message: e instanceof Error ? e.message : 'Invalid phone.' })
  }

  const record = await prisma.mpesaB2cDisbursement.create({
    data: {
      status: 'PENDING',
      phone: msisdn,
      amount: new Prisma.Decimal(amount),
      categoryId: body.categoryId ?? null,
    },
  })

  const pay = await sendMoney({
    partyBMsisdn254: msisdn,
    amountKes: amount,
    remarks: 'Chama transfer',
    occasion: body.categoryId ? String(body.categoryId).slice(0, 80) : undefined,
  })

  if (!pay.ok) {
    const friendly =
      pay.responseCode != null && isInsufficientFundsResult(pay.responseCode)
        ? describeMpesaResultCode(pay.responseCode) ?? pay.error
        : pay.error

    await prisma.mpesaB2cDisbursement.update({
      where: { id: record.id },
      data: {
        status: 'FAILED',
        resultCode: pay.responseCode != null ? String(pay.responseCode) : null,
        resultDesc: friendly,
        rawSubmitResponse: pay.raw === undefined ? Prisma.JsonNull : (pay.raw as Prisma.InputJsonValue),
      },
    })

    return res.status(502).json({
      success: false,
      message: friendly,
      id: record.id,
    })
  }

  await prisma.mpesaB2cDisbursement.update({
    where: { id: record.id },
    data: {
      status: 'SUBMITTED',
      conversationId: pay.conversationId,
      originatorConversationId: pay.originatorConversationId,
      rawSubmitResponse: pay.raw as Prisma.InputJsonValue,
    },
  })

  void refreshBalanceInBackground().catch(() => {})

  return res.json({
    success: true,
    id: record.id,
    status: 'SUBMITTED',
    conversationId: pay.conversationId,
    originatorConversationId: pay.originatorConversationId,
  })
})

async function refreshBalanceInBackground(): Promise<void> {
  await getAccountBalance().catch(() => {})
}

mpesaApiRouter.get('/status/:id', async (req, res) => {
  const id = req.params.id
  if (!id) return res.status(400).json({ success: false, message: 'Missing id.' })

  const row = await prisma.mpesaB2cDisbursement.findUnique({ where: { id } })
  if (!row) return res.status(404).json({ success: false, message: 'Transfer not found.' })

  if (row.status === 'SUBMITTED' && row.originatorConversationId) {
    const q = await checkTransactionStatus({ originatorConversationId: row.originatorConversationId })
    if (q.ok) {
      const code = q.resultCode
      const desc = q.resultDesc ?? describeMpesaResultCode(code)
      const descLower = (desc ?? '').toLowerCase()
      const looksPending =
        descLower.includes('still under processing') ||
        descLower.includes('being processed') ||
        descLower.includes('pending')

      if (looksPending || code == null || code === '') {
        await prisma.mpesaB2cDisbursement.update({
          where: { id },
          data: { lastQueryResponse: q.raw as Prisma.InputJsonValue },
        })
      } else if (code === '0') {
        await prisma.mpesaB2cDisbursement.update({
          where: { id },
          data: {
            status: 'SUCCESS',
            resultCode: code,
            resultDesc: desc,
            lastQueryResponse: q.raw as Prisma.InputJsonValue,
          },
        })
      } else {
        await prisma.mpesaB2cDisbursement.update({
          where: { id },
          data: {
            status: 'FAILED',
            resultCode: code,
            resultDesc: desc ?? describeMpesaResultCode(code) ?? 'Transfer failed.',
            lastQueryResponse: q.raw as Prisma.InputJsonValue,
          },
        })
      }
    }
  }

  const latest = await prisma.mpesaB2cDisbursement.findUnique({ where: { id } })
  if (!latest) return res.status(404).json({ success: false, message: 'Transfer not found.' })

  return res.json({
    success: true,
    id: latest.id,
    status: latest.status,
    resultCode: latest.resultCode,
    resultDesc: latest.resultDesc,
    conversationId: latest.conversationId,
    originatorConversationId: latest.originatorConversationId,
  })
})

mpesaApiRouter.get('/balance', async (_req, res) => {
  let cfg: ReturnType<typeof loadMpesaServerConfig>
  try {
    cfg = loadMpesaServerConfig()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'M-Pesa is not configured on this server.'
    return res.status(503).json({ success: false, message: msg })
  }

  const cached = await prisma.mpesaWorkingBalanceCache.findUnique({ where: { id: CACHE_ID } })
  const cachedNum = cached?.balanceKes != null ? Number(cached.balanceKes) : null

  void getAccountBalance().catch(() => {})

  const balanceKes =
    cachedNum != null && Number.isFinite(cachedNum)
      ? cachedNum
      : cfg.workingBalanceFallbackKes != null
        ? cfg.workingBalanceFallbackKes
        : null

  return res.json({
    success: true,
    balanceKes,
    stale: cachedNum == null,
    updatedAt: cached?.updatedAt?.toISOString() ?? null,
    hint:
      'Daraja returns working balance on the AccountBalance result URL. Until that callback is wired, use MPESA_WORKING_BALANCE_FALLBACK_KES for local UI.',
  })
})

/** Safaricom AccountBalance asynchronous result (configure as MPESA_ACCOUNT_BALANCE_RESULT_URL). */
mpesaApiRouter.post('/webhooks/account-balance', async (req, res) => {
  const amount = parseAccountBalanceKes(req.body)
  if (amount != null && Number.isFinite(amount)) {
    await prisma.mpesaWorkingBalanceCache.upsert({
      where: { id: CACHE_ID },
      create: { id: CACHE_ID, balanceKes: new Prisma.Decimal(amount) },
      update: { balanceKes: new Prisma.Decimal(amount) },
    })
  }
  return res.json({ ResultCode: 0, ResultDesc: 'Accepted' })
})
