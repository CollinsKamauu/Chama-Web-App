/**
 * Stubbed invite flow until backend APIs exist.
 */
export async function generateInviteCodeStub(): Promise<{ code: string }> {
  await new Promise((r) => setTimeout(r, 450))
  const segment = () => Math.random().toString(36).slice(2, 6).toUpperCase()
  return { code: `CHAMA-${segment()}-${segment()}` }
}

export async function confirmInviteStub(
  _name: string,
  _email: string,
  _code: string,
): Promise<{ ok: boolean }> {
  await new Promise((r) => setTimeout(r, 500))
  return { ok: true }
}
