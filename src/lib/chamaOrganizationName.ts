export const CHAMA_ORG_STORAGE_KEY = 'chama_organization_name'

export const DEFAULT_CHAMA_ORG_NAME = 'Milestone Fraternity'

export function getChamaOrganizationName(): string {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_CHAMA_ORG_NAME
    const v = localStorage.getItem(CHAMA_ORG_STORAGE_KEY)
    return (v && v.trim()) || DEFAULT_CHAMA_ORG_NAME
  } catch {
    return DEFAULT_CHAMA_ORG_NAME
  }
}

export function setChamaOrganizationNameInStorage(name: string): void {
  try {
    const trimmed = name.trim() || DEFAULT_CHAMA_ORG_NAME
    localStorage.setItem(CHAMA_ORG_STORAGE_KEY, trimmed)
  } catch {
    // ignore
  }
}
