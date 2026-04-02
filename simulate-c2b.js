// Simulate Daraja C2B confirmations against the deployed backend.
// Run: node simulate-c2b.js
// Stop: Ctrl+C

import https from 'node:https'

const BACKEND_URL = 'https://milestone-chama-backend.onrender.com/confirmation'
const BILL_REF = 'MSL'
const BUSINESS_SHORT_CODE = '600999'
const INTERVAL_MS = 10000

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body)
    const parsed = new URL(url)

    const req = https.request(
      {
        method: 'POST',
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        port: 443,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let text = ''
        res.on('data', (chunk) => {
          text += chunk
        })
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode || 0,
            body: text,
          })
        })
      },
    )

    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

function nowSafaricomTimestamp(d) {
  // Example: 20260326143000
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${yyyy}${mm}${dd}${hh}${mi}${ss}`
}

function uniqueTransId(seq) {
  // Keep alphanumeric, reasonably short, and unique over time.
  const stamp = Date.now().toString(36).toUpperCase()
  const idx = seq.toString(36).toUpperCase().padStart(4, '0')
  return `SIM${stamp}${idx}`
}

function uniqueMsisdn(seq) {
  // Produces 2547XXXXXXXX with unique suffix per sequence.
  const base = 700000000
  const next = base + (seq % 99999999)
  return `254${String(next).padStart(9, '0')}`
}

function buildPayload(seq) {
  const now = new Date()
  const amount = (100 + (seq * 73) % 5000).toFixed(2)

  return {
    TransID: uniqueTransId(seq),
    TransAmount: amount,
    MSISDN: uniqueMsisdn(seq),
    BillRefNumber: BILL_REF,
    TransTime: nowSafaricomTimestamp(now),
    BusinessShortCode: BUSINESS_SHORT_CODE,
    FirstName: 'Demo',
    MiddleName: '',
    LastName: 'User',
    TransactionType: 'Pay Bill',
  }
}

let counter = 1

async function sendOne() {
  const payload = buildPayload(counter++)
  try {
    const result = await postJson(BACKEND_URL, payload)
    const preview = result.body.length > 180 ? `${result.body.slice(0, 180)}...` : result.body
    console.log(
      `[SIM] ${payload.TransID} KES ${payload.TransAmount} ${payload.MSISDN} -> ${result.statusCode} ${preview}`,
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`[SIM] Request failed: ${msg}`)
  }
}

console.log(`Starting C2B simulator -> ${BACKEND_URL}`)
console.log(`BillRefNumber=${BILL_REF}, ShortCode=${BUSINESS_SHORT_CODE}, Interval=${INTERVAL_MS}ms`)
console.log('Press Ctrl+C to stop.\n')

void sendOne()
setInterval(() => {
  void sendOne()
}, INTERVAL_MS)

