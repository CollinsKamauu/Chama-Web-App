/** Normalizes Kenyan phone input to MSISDN 2547XXXXXXXX (digits only). */
export function normalizeMsisdn254(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.startsWith('254') && digits.length >= 12) return digits
  if (digits.startsWith('254') && digits.length === 11) return digits
  if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`
  if (digits.length === 9 && digits.startsWith('7')) return `254${digits}`
  if (digits.length === 10 && digits.startsWith('7')) return `254${digits}`
  throw new Error('Enter a valid Kenyan mobile number (e.g. 07XX XXX XXX).')
}
