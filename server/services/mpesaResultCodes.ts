/** Common Daraja ResultCode values (string or number from payloads). */

const KNOWN: Record<string, string> = {
  '0': 'Request completed successfully.',
  '1': 'Insufficient funds, or the transaction would exceed balance or transfer limits.',
  '2': 'Less than minimum transaction value.',
  '3': 'More than maximum transaction value.',
  '4': 'Would exceed daily transfer limit.',
  '5': 'Would exceed minimum balance.',
  '6': 'Unresolved primary party.',
  '7': 'Unresolved initiator.',
  '8': 'Invalid security credential.',
  '11': 'Invalid request.',
  '2001':
    'Insufficient funds in the working account, or invalid initiator / security credential (verify with Safaricom).',
  '1032': 'The request has been cancelled by the user.',
  '1037': 'The transaction has timed out.',
  '1025': 'An error occurred while sending push request.',
  '1019': 'Transaction expired. No MO received.',
}

/**
 * Maps a Daraja ResultCode to a short user-facing message.
 * @see https://developer.safaricom.co.ke/APIs
 */
export function describeMpesaResultCode(code: string | number | null | undefined): string | null {
  if (code === null || code === undefined) return null
  const key = String(code).trim()
  if (key === '') return null
  return KNOWN[key] ?? `M-Pesa returned code ${key}.`
}

export function isInsufficientFundsResult(code: string | number | null | undefined): boolean {
  const k = String(code ?? '').trim()
  return k === '1' || k === '2001'
}
