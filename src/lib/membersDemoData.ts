import type { MemberRole, MemberRow } from '../types/members'

const FIRST_NAMES = [
  'Grace',
  'Peter',
  'Wanjiku',
  'James',
  'Amina',
  'David',
  'Lucy',
  'Samuel',
  'Mary',
  'Tom',
  'Ruth',
  'Brian',
  'Esther',
  'Kevin',
  'Lucia',
  'Daniel',
  'Faith',
  'Joseph',
  'Ann',
  'Paul',
]

const LAST_NAMES = [
  'Muthoni',
  'Otieno',
  'Njeri',
  'Kariuki',
  'Hassan',
  'Ochieng',
  'Chebet',
  'Njoroge',
  'Akinyi',
  'Mwenda',
  'Wambui',
  'Mutua',
  'Adhiambo',
  'Kamau',
  'Wangari',
  'Kimani',
  'Omondi',
  'Achieng',
  'Mwangi',
  'Onyango',
]

function pickRandomIndices(min: number, maxInclusive: number, take: number, seed: number): Set<number> {
  const pool = Array.from({ length: maxInclusive - min + 1 }, (_, k) => min + k)
  let s = seed >>> 0
  const rnd = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1))
    const tmp = pool[i]!
    pool[i] = pool[j]!
    pool[j] = tmp
  }
  return new Set(pool.slice(0, take))
}

/** Demo members shown when app mode is Demo. */
export function buildDemoMembers(): MemberRow[] {
  const boardMemberAt = pickRandomIndices(4, 246, 6, 20260217)
  const rows: MemberRow[] = [
    { id: 'm1', name: 'Juma Yusuf', phone: '+254 722 123 456', role: 'Chairperson', contributions: 120_000 },
    { id: 'm2', name: 'Grace Muthoni', phone: '+254 733 987 654', role: 'Treasurer', contributions: 118_500 },
    { id: 'm3', name: 'Peter Otieno', phone: '+254 711 456 789', role: 'Secretary', contributions: 95_000 },
    { id: 'm4', name: 'Wanjiku Njeri', phone: '+254 722 111 222', role: 'Vice Chairperson', contributions: 102_400 },
  ]

  for (let i = 4; i < 247; i += 1) {
    const role: MemberRole = boardMemberAt.has(i) ? 'Board Member' : 'Member'
    const fn = FIRST_NAMES[(i * 3) % FIRST_NAMES.length]
    const ln = LAST_NAMES[(i * 5) % LAST_NAMES.length]
    const a = 700 + ((i * 13) % 100)
    const b = 100 + ((i * 7) % 900)
    const c = 100 + ((i * 11) % 900)
    rows.push({
      id: `m${i + 1}`,
      name: `${fn} ${ln}`,
      phone: `+254 ${a} ${b} ${c}`,
      role,
      contributions: 500 + ((i * 7919 + 101) % 99500),
    })
  }

  return rows
}
