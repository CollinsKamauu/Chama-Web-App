export type MemberRole = 'Chairperson' | 'Treasurer' | 'Secretary' | 'Vice Chairperson' | 'Member' | 'Board Member'

export type MemberRow = {
  id: string
  name: string
  phone: string
  role: MemberRole
  contributions: number
}
