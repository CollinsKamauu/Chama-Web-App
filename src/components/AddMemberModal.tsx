import { type FormEvent, useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { MemberRole } from '../types/members'

export type NewMemberPayload = {
  fullName: string
  phone: string
  role: MemberRole
}

type AddMemberModalProps = {
  open: boolean
  onClose: () => void
  /** Called with validated form data. Replace with API `POST /api/members` when ready. */
  onSubmit: (payload: NewMemberPayload) => void | Promise<void>
}

const ROLE_OPTIONS: { label: string; value: MemberRole; pillClass: string }[] = [
  { label: 'Chairperson', value: 'Chairperson', pillClass: 'membersModalRolePill--chairperson' },
  { label: 'Treasurer', value: 'Treasurer', pillClass: 'membersModalRolePill--treasurer' },
  { label: 'Secretary', value: 'Secretary', pillClass: 'membersModalRolePill--secretary' },
  { label: 'Vice Chairperson', value: 'Vice Chairperson', pillClass: 'membersModalRolePill--viceChairperson' },
  { label: 'Board Member', value: 'Board Member', pillClass: 'membersModalRolePill--boardMember' },
  { label: 'Member', value: 'Member', pillClass: 'membersModalRolePill--member' },
]

function ModalTitleIcon() {
  return (
    <svg className="membersModalTitleIcon" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="9" cy="8" r="3.25" fill="currentColor" />
      <path
        d="M4.5 20v-0.75c0-2.35 1.9-4.25 4.25-4.25h0.5c2.35 0 4.25 1.9 4.25 4.25V20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path d="M16 10v7M12.5 13.5h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function AddMemberModal({ open, onClose, onSubmit }: AddMemberModalProps) {
  const titleId = useId()
  const nameId = useId()
  const phoneId = useId()
  const roleGroupId = useId()
  const nameInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<MemberRole | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reset = useCallback(() => {
    setFullName('')
    setPhone('')
    setRole(null)
    setError(null)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    reset()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => {
      nameInputRef.current?.focus()
    })
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open, reset])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        reset()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, reset])

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const name = fullName.trim()
    const ph = phone.trim()
    if (!name) {
      setError('Please enter a name.')
      return
    }
    if (!ph) {
      setError('Please enter a phone number.')
      return
    }
    if (!role) {
      setError('Please select a role.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      const payload: NewMemberPayload = { fullName: name, phone: ph, role }
      await Promise.resolve(onSubmit(payload))
      reset()
      onClose()
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  return createPortal(
    <div className="membersModalRoot" role="presentation">
      <button type="button" className="membersModalBackdrop" aria-label="Close dialog" onClick={handleClose} />
      <div
        className="membersModalCard"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(ev) => ev.stopPropagation()}
      >
        <header className="membersModalHeader">
          <div className="membersModalTitleChip" id={titleId}>
            <ModalTitleIcon />
            <span>Add New Member</span>
          </div>
          <button type="button" className="membersModalClose" aria-label="Close" onClick={handleClose}>
            ×
          </button>
        </header>

        <form className="membersModalForm" onSubmit={handleSubmit}>
          <div className="membersModalField">
            <label htmlFor={nameId}>Name</label>
            <input
              ref={nameInputRef}
              id={nameId}
              type="text"
              autoComplete="name"
              placeholder="First & Last Names"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="membersModalField">
            <label htmlFor={phoneId}>Phone Number</label>
            <input
              id={phoneId}
              type="tel"
              autoComplete="tel"
              placeholder="+254…"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="membersModalField">
            <div className="membersModalRoleLabelRow">
              <span id={roleGroupId}>Role</span>
              <span className="membersModalRoleHint">(Select One)</span>
            </div>
            <div className="membersModalRolePills" role="group" aria-labelledby={roleGroupId}>
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`membersModalRolePill ${opt.pillClass}${role === opt.value ? ' isSelected' : ''}`}
                  aria-pressed={role === opt.value}
                  onClick={() => setRole(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error ? <p className="membersModalError">{error}</p> : null}

          <button type="submit" className="membersModalConfirm" disabled={busy}>
            {busy ? 'Saving…' : 'Confirm'}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  )
}
