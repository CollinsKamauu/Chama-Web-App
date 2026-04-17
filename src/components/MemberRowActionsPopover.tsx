import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { MemberRole, MemberRow } from '../types/members'

const MENU_ROLE_OPTIONS: { label: string; value: MemberRole; pillClass: string }[] = [
  { label: 'Chairperson', value: 'Chairperson', pillClass: 'membersRowMenuRolePill--chairperson' },
  { label: 'Treasurer', value: 'Treasurer', pillClass: 'membersRowMenuRolePill--treasurer' },
  { label: 'Secretary', value: 'Secretary', pillClass: 'membersRowMenuRolePill--secretary' },
  { label: 'Vice Chairperson', value: 'Vice Chairperson', pillClass: 'membersRowMenuRolePill--viceChairperson' },
  { label: 'Board Member', value: 'Board Member', pillClass: 'membersRowMenuRolePill--boardMember' },
  { label: 'Member', value: 'Member', pillClass: 'membersRowMenuRolePill--member' },
]

export type MemberRowActionsPopoverProps = {
  member: MemberRow
  position: { top: number; left: number }
  onClose: () => void
  /** TODO: PATCH /api/members/:id/role when backend exists */
  onChangeRole: (memberId: string, role: MemberRole) => void
  /** TODO: DELETE /api/members/:id when backend exists */
  onDelete: (memberId: string) => void
}

export function MemberRowActionsPopover({
  member,
  position,
  onClose,
  onChangeRole,
  onDelete,
}: MemberRowActionsPopoverProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [editRoleOpen, setEditRoleOpen] = useState(false)

  useEffect(() => {
    setEditRoleOpen(false)
  }, [member.id])

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (rootRef.current?.contains(t)) return
      const el = t as Element
      if (el.closest?.('[data-members-actions-trigger]')) return
      onClose()
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const pickRole = (role: MemberRole) => {
    onChangeRole(member.id, role)
    setEditRoleOpen(false)
    onClose()
  }

  const handleDelete = () => {
    if (!window.confirm(`Remove ${member.name} from the member list?`)) return
    onDelete(member.id)
    onClose()
  }

  return createPortal(
    <div
      ref={rootRef}
      className="membersRowMenuPopover"
      style={{ top: position.top, left: position.left }}
      role="menu"
      aria-label={`Actions for ${member.name}`}
    >
      <p className="membersRowMenuPopoverTitle">Select Option</p>

      <div className="membersRowMenuPopoverSection">
        <button
          type="button"
          className="membersRowMenuEditRole"
          aria-expanded={editRoleOpen}
          aria-controls={`members-row-role-list-${member.id}`}
          onClick={() => setEditRoleOpen((o) => !o)}
        >
          <img src="/dashboard-icons/Account.svg" alt="" width={18} height={18} className="membersRowMenuEditRoleIcon" />
          <span>Edit Role</span>
          <img
            src="/dashboard-icons/chevron-down.svg"
            alt=""
            width={14}
            height={14}
            className={`membersRowMenuEditRoleChevron${editRoleOpen ? ' isOpen' : ''}`}
          />
        </button>
        {editRoleOpen ? (
          <div
            className="membersRowMenuRoleList"
            id={`members-row-role-list-${member.id}`}
            role="group"
            aria-label="Choose role"
          >
            {MENU_ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`membersRowMenuRolePill ${opt.pillClass}${member.role === opt.value ? ' isCurrent' : ''}`}
                role="menuitem"
                onClick={() => pickRole(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="membersRowMenuPopoverDivider" />

      <button type="button" className="membersRowMenuDelete" role="menuitem" onClick={handleDelete}>
        <img src="/dashboard-icons/Delete Icon.svg" alt="" width={14} height={14} />
        <span>Delete Member</span>
      </button>
    </div>,
    document.body,
  )
}
