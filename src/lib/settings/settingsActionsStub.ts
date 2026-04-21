/** Replace with real API calls when wired. */
function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

export async function updateChamaNameStub(name: string): Promise<{ ok: boolean }> {
  await delay(700)
  return { ok: name.trim().length > 0 }
}

export async function updateAccountEmailStub(email: string): Promise<{ ok: boolean }> {
  await delay(700)
  return { ok: email.trim().length > 0 && email.includes('@') }
}

export async function revokeUserAccessStub(userName: string, userEmail: string): Promise<{ ok: boolean }> {
  await delay(800)
  return { ok: userName.trim().length > 0 && userEmail.trim().length > 0 && userEmail.includes('@') }
}
