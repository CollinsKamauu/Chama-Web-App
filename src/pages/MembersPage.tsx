import { useVirtualizer } from '@tanstack/react-virtual'
import { type MouseEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AddMemberModal } from '../components/AddMemberModal'
import { MemberRowActionsPopover } from '../components/MemberRowActionsPopover'
import { DashboardChrome } from '../components/DashboardChrome'
import { useAuth } from '../context/AuthContext'
import { useMembers } from '../hooks/useMembers'
import { maskPhoneLastSixDigits } from '../lib/contributionsExport/maskPhone'
import type { MemberRole } from '../types/members'
import '../App.css'

const EXPORT_OPTIONS = ['PDF', 'Excel', 'Doc', 'CSV'] as const

const MEMBERS_TABLE_COL_COUNT = 5

/** Higher = more senior. Used for role-column sort. */
const ROLE_SENIORITY: Record<MemberRole, number> = {
  Chairperson: 60,
  'Vice Chairperson': 50,
  Treasurer: 40,
  Secretary: 30,
  'Board Member': 20,
  Member: 10,
}

type SortColumn = 'name' | 'role'

function roleToSlug(role: MemberRole): string {
  switch (role) {
    case 'Chairperson':
      return 'chairperson'
    case 'Treasurer':
      return 'treasurer'
    case 'Secretary':
      return 'secretary'
    case 'Vice Chairperson':
      return 'viceChairperson'
    case 'Board Member':
      return 'boardMember'
    default:
      return 'member'
  }
}

function SortChevronIcon({ descending, active }: { descending: boolean; active: boolean }) {
  const up = active && !descending ? 1 : active ? 0.35 : 0.4
  const down = active && descending ? 1 : active ? 0.35 : 0.4
  return (
    <svg className="membersSortIcon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 6l3.5 4.5H8.5L12 6z" fill="currentColor" opacity={up} />
      <path d="M12 18l-3.5-4.5h7L12 18z" fill="currentColor" opacity={down} />
    </svg>
  )
}

export default function MembersPage() {
  const navigate = useNavigate()
  const { displayName, logout } = useAuth()
  const profileName = displayName || 'John Doe'
  const { members, loading: membersLoading, error: membersError, addMember, changeRole, removeMember } =
    useMembers()

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [rowActionMenu, setRowActionMenu] = useState<{ id: string; top: number; left: number } | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const addMemberButtonRef = useRef<HTMLButtonElement>(null)

  const [sortColumn, setSortColumn] = useState<SortColumn>('name')
  const [sortDesc, setSortDesc] = useState(false)

  const sortedMembers = useMemo(() => {
    const list = [...members]
    list.sort((a, b) => {
      if (sortColumn === 'name') {
        const cmp = a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
        return sortDesc ? -cmp : cmp
      }
      const ra = ROLE_SENIORITY[a.role]
      const rb = ROLE_SENIORITY[b.role]
      const byRank = sortDesc ? ra - rb : rb - ra
      if (byRank !== 0) return byRank
      return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
    })
    return list
  }, [members, sortColumn, sortDesc])

  const tableScrollRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: sortedMembers.length,
    getScrollElement: () => tableScrollRef.current,
    estimateSize: () => 52,
    overscan: 14,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const padTop = virtualRows.length > 0 ? virtualRows[0].start : 0
  const padBottom =
    virtualRows.length > 0
      ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end
      : 0

  const handleAddMemberSubmit = async (payload: Parameters<typeof addMember>[0]) => {
    setActionError(null)
    await addMember(payload)
  }

  const [exportOpen, setExportOpen] = useState(false)
  const [exportBusy, setExportBusy] = useState(false)
  const exportWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!exportOpen) return undefined
    const onPointerDown = (e: PointerEvent) => {
      const el = exportWrapRef.current
      if (el && !el.contains(e.target as Node)) setExportOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [exportOpen])

  useEffect(() => {
    if (!exportOpen) return undefined
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setExportOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [exportOpen])

  const handleLogout = (evt?: MouseEvent<HTMLButtonElement>) => {
    evt?.preventDefault()
    localStorage.removeItem('chama_token')
    logout()
    navigate('/login', { replace: true })
  }

  const handleExport = async (format: (typeof EXPORT_OPTIONS)[number]) => {
    setExportOpen(false)
    setExportBusy(true)
    try {
      const { runMembersExport } = await import('../lib/membersExport')
      await runMembersExport(format, {
        rows: sortedMembers,
        exportedAt: new Date(),
      })
    } catch (err) {
      console.error(err)
      window.alert('Export failed. Please try again.')
    } finally {
      setExportBusy(false)
    }
  }

  const onSortName = () => {
    if (sortColumn === 'name') {
      setSortDesc((d) => !d)
    } else {
      setSortDesc(false)
      setSortColumn('name')
    }
  }

  const onSortRole = () => {
    if (sortColumn === 'role') {
      setSortDesc((d) => !d)
    } else {
      setSortDesc(false)
      setSortColumn('role')
    }
  }

  const rowActionMenuMember = rowActionMenu ? members.find((m) => m.id === rowActionMenu.id) : undefined

  const openRowActionMenu = (e: MouseEvent<HTMLButtonElement>, memberId: string) => {
    e.stopPropagation()
    const r = e.currentTarget.getBoundingClientRect()
    const menuWidth = 216
    const left = Math.max(8, Math.min(r.right - menuWidth, window.innerWidth - menuWidth - 8))
    const top = r.bottom + 6
    setRowActionMenu((prev) => (prev?.id === memberId ? null : { id: memberId, top, left }))
  }

  const handleRowChangeRole = async (memberId: string, role: MemberRole) => {
    setActionError(null)
    try {
      await changeRole(memberId, role)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update role.')
    }
  }

  const handleRowDelete = async (memberId: string) => {
    setActionError(null)
    try {
      await removeMember(memberId)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete member.')
    }
  }

  return (
    <DashboardChrome profileName={profileName} onLogout={handleLogout}>
      <AddMemberModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddMemberSubmit}
        widthAnchorRef={addMemberButtonRef}
      />
      {rowActionMenuMember && rowActionMenu ? (
        <MemberRowActionsPopover
          member={rowActionMenuMember}
          position={{ top: rowActionMenu.top, left: rowActionMenu.left }}
          onClose={() => setRowActionMenu(null)}
          onChangeRole={handleRowChangeRole}
          onDelete={handleRowDelete}
        />
      ) : null}
      <div className="mainContent contributionsMain membersMain">
        <article className="contributionsReportCard membersReportCard">
          <header className="contributionsReportHeader membersReportHeader">
            <div className="contributionsReportIdentity">
              <div className="contributionsReportIconWrap" aria-hidden="true">
                <img src="/dashboard-icons/Members Active.svg" alt="" />
              </div>
              <div className="contributionsReportHeadingText">
                <h2 className="contributionsReportTitle">Chama Members</h2>
                <p className="contributionsReportMeta">Total Registered Members</p>
                <p className="membersTotalStat">{members.length.toLocaleString('en-US')} Members</p>
                {membersError ? <p className="financesInlineError">{membersError}</p> : null}
                {actionError ? <p className="financesInlineError">{actionError}</p> : null}
              </div>
            </div>

            <button ref={addMemberButtonRef} type="button" className="membersAddButton" onClick={() => setAddModalOpen(true)}>
              <img src="/dashboard-icons/Invite Code.svg" alt="" width={20} height={18} />
              Add New Member
            </button>
          </header>

          <div
            ref={tableScrollRef}
            className="contributionsTableScroll membersTableScroll"
            role="region"
            aria-label="Chama members"
          >
            <table className="contributionsTable membersTable">
              <caption className="visuallyHidden">
                Members: name, phone number, role, contributions in KES, and row actions. Sort by name or role from
                column headers.
              </caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    aria-sort={sortColumn === 'name' ? (sortDesc ? 'descending' : 'ascending') : undefined}
                  >
                    <button type="button" className="membersSortThButton" onClick={onSortName}>
                      Name
                      <SortChevronIcon active={sortColumn === 'name'} descending={sortDesc} />
                    </button>
                  </th>
                  <th scope="col">Phone Number</th>
                  <th
                    scope="col"
                    aria-sort={sortColumn === 'role' ? (sortDesc ? 'ascending' : 'descending') : undefined}
                  >
                    <button type="button" className="membersSortThButton" onClick={onSortRole}>
                      Role
                      <SortChevronIcon active={sortColumn === 'role'} descending={sortDesc} />
                    </button>
                  </th>
                  <th scope="col">Contributions</th>
                  <th scope="col">
                    <span className="visuallyHidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {membersLoading ? (
                  <tr>
                    <td colSpan={MEMBERS_TABLE_COL_COUNT} className="financesTableLoading">
                      Loading…
                    </td>
                  </tr>
                ) : null}
                {!membersLoading && sortedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={MEMBERS_TABLE_COL_COUNT} className="financesTableLoading">
                      No members yet.
                    </td>
                  </tr>
                ) : null}
                {!membersLoading && padTop > 0 ? (
                  <tr className="membersTableVirtualPadRow" aria-hidden="true">
                    <td
                      className="membersTableVirtualSpacer"
                      colSpan={MEMBERS_TABLE_COL_COUNT}
                      style={{ height: padTop }}
                    />
                  </tr>
                ) : null}
                {!membersLoading &&
                  virtualRows.map((vr) => {
                    const row = sortedMembers[vr.index]!
                    return (
                      <tr key={row.id} data-index={vr.index} ref={rowVirtualizer.measureElement}>
                        <td>{row.name}</td>
                        <td>{maskPhoneLastSixDigits(row.phone)}</td>
                        <td>
                          <span className={`membersRolePill membersRolePill--${roleToSlug(row.role)}`}>{row.role}</span>
                        </td>
                        <td className="contributionsAmountCell">{row.contributions.toLocaleString('en-US')}</td>
                        <td className="membersActionsCell">
                          <button
                            type="button"
                            className="membersRowMenuButton"
                            aria-label={`Actions for ${row.name}`}
                            aria-haspopup="menu"
                            aria-expanded={rowActionMenu?.id === row.id}
                            data-members-actions-trigger={row.id}
                            onClick={(e) => openRowActionMenu(e, row.id)}
                          >
                            <img src="/dashboard-icons/more-vertical.svg" alt="" width={20} height={20} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                {!membersLoading && padBottom > 0 ? (
                  <tr className="membersTableVirtualPadRow" aria-hidden="true">
                    <td
                      className="membersTableVirtualSpacer"
                      colSpan={MEMBERS_TABLE_COL_COUNT}
                      style={{ height: padBottom }}
                    />
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <footer className="contributionsReportFooter membersReportFooter">
            <div className="contributionsExportWrap" ref={exportWrapRef}>
              <button
                type="button"
                className="contributionsExportButton"
                aria-haspopup="listbox"
                aria-expanded={exportOpen}
                aria-controls="members-export-menu"
                id="members-export-trigger"
                disabled={exportBusy}
                onClick={() => setExportOpen((o) => !o)}
              >
                {exportBusy ? 'Exporting...' : 'Export'}
                <img src="/dashboard-icons/chevron-down.svg" alt="" />
              </button>
              {exportOpen ? (
                <ul
                  className="contributionsExportMenu metricPeriodMenu"
                  id="members-export-menu"
                  role="listbox"
                  aria-labelledby="members-export-trigger"
                >
                  {EXPORT_OPTIONS.map((opt) => (
                    <li key={opt} role="presentation">
                      <button
                        type="button"
                        role="option"
                        disabled={exportBusy}
                        onClick={() => void handleExport(opt)}
                      >
                        {opt === 'Doc' ? 'Word' : opt}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </footer>
        </article>
      </div>
    </DashboardChrome>
  )
}
