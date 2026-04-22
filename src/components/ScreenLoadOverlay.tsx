import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

const OVERLAY_MIN_MS = 1000

/** Three-dot pulse (inline SVG so embedded style keyframes run; img[src=.svg] often does not). */
function ChamaPulseSvg() {
  return (
    <svg
      className="screenLoadOverlay__svg"
      width={72}
      height={19}
      viewBox="0 0 120 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <style>{`
        .screenLoadOverlay__svg .pulseDot {
          transform-box: fill-box;
          transform-origin: center;
          animation: screenLoadHorizontalPulse 1.2s ease-in-out infinite;
        }
        .screenLoadOverlay__svg .pulseDot--1 { animation-delay: 0s; }
        .screenLoadOverlay__svg .pulseDot--2 { animation-delay: 0.2s; }
        .screenLoadOverlay__svg .pulseDot--3 { animation-delay: 0.4s; }
        @keyframes screenLoadHorizontalPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.8); }
        }
      `}</style>
      <g transform="translate(60 16) scale(0.6) translate(-60 -16)">
        <circle className="pulseDot pulseDot--1" cx={16} cy={16} r={12} fill="#2070D2" />
        <circle className="pulseDot pulseDot--2" cx={60} cy={16} r={12} fill="#2070D2" />
        <circle className="pulseDot pulseDot--3" cx={104} cy={16} r={12} fill="#2070D2" />
      </g>
    </svg>
  )
}

/**
 * Full-screen pulse during client-side route changes.
 * BrowserRouter has no async "navigation loading" state; this keys off location.key.
 */
export default function ScreenLoadOverlay() {
  const location = useLocation()
  const [visible, setVisible] = useState(false)
  const prevKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (prevKeyRef.current === null) {
      prevKeyRef.current = location.key
      return
    }
    if (prevKeyRef.current === location.key) return
    prevKeyRef.current = location.key

    setVisible(true)
    const id = window.setTimeout(() => setVisible(false), OVERLAY_MIN_MS)
    return () => window.clearTimeout(id)
  }, [location.key])

  if (!visible) return null

  return (
    <div className="screenLoadOverlay" role="status" aria-live="polite" aria-busy="true">
      <ChamaPulseSvg />
    </div>
  )
}
