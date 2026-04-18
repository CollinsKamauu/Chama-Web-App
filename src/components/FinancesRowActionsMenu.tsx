import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export type FinancesRowActionsMenuProps = {
  transactionLabel: string
  position: { top: number; left: number }
  onClose: () => void
  onViewDetails: () => void
  onEdit: () => void
  onDelete: () => void
}

export function FinancesRowActionsMenu({
  transactionLabel,
  position,
  onClose,
  onViewDetails,
  onEdit,
  onDelete,
}: FinancesRowActionsMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (rootRef.current?.contains(t)) return
      const el = t as Element
      if (el.closest?.('[data-finances-actions-trigger]')) return
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

  return createPortal(
    <div
      ref={rootRef}
      className="financesRowMenuPopover"
      style={{ top: position.top, left: position.left }}
      role="menu"
      aria-label={`Actions for ${transactionLabel}`}
    >
      <p className="financesRowMenuPopoverTitle">Select Option</p>
      <div className="financesRowMenuPopoverSection">
        <button
          type="button"
          className="financesRowMenuAction"
          role="menuitem"
          onClick={() => {
            onViewDetails()
            onClose()
          }}
        >
          View Details
        </button>
        <button
          type="button"
          className="financesRowMenuAction"
          role="menuitem"
          onClick={() => {
            onEdit()
            onClose()
          }}
        >
          Edit
        </button>
        <button
          type="button"
          className="financesRowMenuAction financesRowMenuAction--danger"
          role="menuitem"
          onClick={() => onDelete()}
        >
          Delete
        </button>
      </div>
    </div>,
    document.body,
  )
}
