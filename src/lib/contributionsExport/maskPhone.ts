/** Replaces the last six digit characters with `*`; keeps `+`, spaces, and other formatting. */
export function maskPhoneLastSixDigits(phone: string): string {
  const digitPositions: number[] = []
  for (let i = 0; i < phone.length; i += 1) {
    const ch = phone[i]
    if (ch !== undefined && ch >= '0' && ch <= '9') digitPositions.push(i)
  }
  if (digitPositions.length === 0) return phone
  const n = Math.min(6, digitPositions.length)
  const toMask = new Set(digitPositions.slice(-n))
  return [...phone].map((ch, i) => (toMask.has(i) ? '*' : ch)).join('')
}
