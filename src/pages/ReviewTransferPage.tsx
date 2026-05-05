import { type MouseEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DashboardChrome } from '../components/DashboardChrome'
import { useAppMode } from '../hooks/useAppMode'
import { useAuth } from '../context/AuthContext'
import { useMpesaWorkingBalance } from '../hooks/useMpesaWorkingBalance'
import { api } from '../lib/api'
import { DEMO_MPESA_TRANSFER_ID } from '../lib/appMode'
import { mpesaClientRoutes } from '../lib/mpesa-config'
import { sendTransferMoney } from '../lib/transferFunds/sendTransferMoney'
import {
  b2cRegisteredUserTransferFee,
  parseTransferAmountInput,
  TRANSFER_CATEGORIES,
  type TransferFundsReviewState,
} from '../lib/transferFunds/transferModel'
import '../App.css'

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      </svg>
    )
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10.4 10.4 0 0 1 12 5c6 0 10 7 10 7a18.4 18.4 0 0 1-4.1 5M6.2 6.2C4.3 7.7 3 10 3 12s4 7 10 7a9.7 9.7 0 0 0 4.2-1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function isReviewStateValid(s: TransferFundsReviewState | null | undefined): s is TransferFundsReviewState {
  if (!s) return false
  const phoneOk = typeof s.phone === 'string' && s.phone.trim().length > 0
  const amountOk = parseTransferAmountInput(s.amount) != null
  return phoneOk && amountOk
}

type SendMoneyPhase = 'idle' | 'processing' | 'sent' | 'failed'

function sendMoneyPhaseClass(phase: SendMoneyPhase): string {
  if (phase === 'processing') return ' transferFundsNextButton--processing'
  if (phase === 'sent') return ' transferFundsNextButton--sent'
  if (phase === 'failed') return ' transferFundsNextButton--failed'
  return ''
}

function sendMoneyLabel(phase: SendMoneyPhase): string {
  if (phase === 'processing') return 'Processing'
  if (phase === 'sent') return 'Sent'
  if (phase === 'failed') return 'Failed'
  return 'Send Money'
}

export default function ReviewTransferPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { displayName, logout } = useAuth()
  const { mode } = useAppMode()
  const profileName = displayName || 'John Doe'

  const { balanceKes, loading: balanceLoading, error: balanceError, refresh: refreshBalance } =
    useMpesaWorkingBalance()
  const [balanceVisible, setBalanceVisible] = useState(false)
  const [sendPhase, setSendPhase] = useState<SendMoneyPhase>('idle')
  const [disbursementId, setDisbursementId] = useState<string | null>(null)
  const [failureDetail, setFailureDetail] = useState<string | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const draft = location.state as TransferFundsReviewState | null

  useEffect(() => {
    if (!isReviewStateValid(draft)) {
      navigate('/transfer-funds', { replace: true })
    }
  }, [draft, navigate])

  const parsedAmount = useMemo(() => parseTransferAmountInput(draft?.amount ?? ''), [draft?.amount])
  const charges = useMemo(() => {
    if (parsedAmount == null) return null
    return b2cRegisteredUserTransferFee(parsedAmount)
  }, [parsedAmount])

  const categoryMeta = useMemo(() => {
    if (!draft?.categoryId) return null
    return TRANSFER_CATEGORIES.find((c) => c.id === draft.categoryId) ?? null
  }, [draft])

  const handleLogout = (evt?: MouseEvent<HTMLButtonElement>) => {
    evt?.preventDefault()
    localStorage.removeItem('chama_token')
    logout()
    navigate('/login', { replace: true })
  }

  const clearPoll = () => {
    if (pollTimerRef.current != null) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }

  useEffect(() => () => clearPoll(), [])

  useEffect(() => {
    if (sendPhase !== 'processing' || disbursementId == null) {
      clearPoll()
      return
    }

    if (disbursementId === DEMO_MPESA_TRANSFER_ID) {
      clearPoll()
      let cancelled = false
      queueMicrotask(() => {
        if (cancelled) return
        setSendPhase('sent')
        setFailureDetail(null)
        refreshBalance()
      })
      return () => {
        cancelled = true
      }
    }

    const pollOnce = async () => {
      const r = await api.get<{
        status?: string
        resultDesc?: string | null
      }>(mpesaClientRoutes.status(disbursementId))
      if (!r.success) return
      const st = typeof r.status === 'string' ? r.status : ''
      if (st === 'SUCCESS') {
        clearPoll()
        setSendPhase('sent')
        setFailureDetail(null)
        refreshBalance()
        return
      }
      if (st === 'FAILED') {
        clearPoll()
        setSendPhase('failed')
        setFailureDetail(typeof r.resultDesc === 'string' ? r.resultDesc : 'Transfer failed.')
      }
    }

    void pollOnce()
    pollTimerRef.current = setInterval(() => {
      void pollOnce()
    }, 3000)

    return () => clearPoll()
  }, [sendPhase, disbursementId, refreshBalance])

  const handleSendMoney = async () => {
    if (!isReviewStateValid(draft)) return
    if (sendPhase === 'processing' || sendPhase === 'sent') return
    setFailureDetail(null)
    setDisbursementId(null)
    setSendPhase('processing')
    try {
      const result = await sendTransferMoney(draft, mode)
      if (!result.ok) {
        clearPoll()
        setSendPhase('failed')
        setFailureDetail(result.message)
        return
      }
      setDisbursementId(result.id)
    } catch {
      clearPoll()
      setSendPhase('failed')
      setFailureDetail('Something went wrong. Try again.')
    }
  }

  if (!isReviewStateValid(draft)) {
    return null
  }

  const phoneDisplay = draft.phone.trim()
  const amountDisplay =
    parsedAmount != null ? `KES ${parsedAmount.toLocaleString('en-US')}` : '—'
  const chargesDisplay = charges != null ? `KES ${charges.toLocaleString('en-US')}` : '—'

  return (
    <DashboardChrome profileName={profileName} onLogout={handleLogout}>
      <div className="mainContent contributionsMain transferFundsMain">
        <article className="contributionsReportCard transferFundsHeroCard">
          <div className="transferFundsHeroGrid">
            <div className="transferFundsHeroLeft">
              <div className="contributionsReportIconWrap financesBalanceIconWrap" aria-hidden="true">
                <img src="/dashboard-icons/Fund Transfer Active.svg" alt="" />
              </div>
              <div className="contributionsReportHeadingText">
                <h1 className="contributionsReportTitle">Transfer Funds</h1>
                <p className="contributionsReportMeta">Make transfers from your Chama to M-Pesa users</p>
              </div>
            </div>
            <div className="transferFundsHeroBalance">
              <div className="transferFundsBalanceLabelRow">
                <span className="transferFundsBalanceLabel">Balance</span>
                <button
                  type="button"
                  className="transferFundsBalanceToggle"
                  aria-pressed={balanceVisible}
                  aria-label={balanceVisible ? 'Hide balance' : 'Show balance'}
                  onClick={() => setBalanceVisible((v) => !v)}
                >
                  <EyeIcon visible={balanceVisible} />
                </button>
              </div>
              <p
                className="transferFundsBalanceAmount"
                aria-live="polite"
                title={balanceError ?? undefined}
              >
                {balanceVisible
                  ? balanceLoading
                    ? 'KES …'
                    : balanceKes != null
                      ? `KES ${balanceKes.toLocaleString('en-US')}`
                      : 'KES —'
                  : 'KES ********'}
              </p>
              {balanceError != null && balanceVisible ? (
                <p className="transferFundsBalanceHint" role="status">
                  {balanceError}{' '}
                  <button type="button" className="transferFundsBalanceRetry" onClick={() => refreshBalance()}>
                    Retry
                  </button>
                </p>
              ) : null}
            </div>
          </div>
        </article>

        <article className="transferFundsFormCard transferFundsReviewFormCard">
          <div className="financesStatementAccent" aria-hidden="true" />
          <div className="transferFundsFormBody transferFundsReviewFormBody">
            <div className="transferFundsReviewBadgeWrap">
              <div className="transferFundsReviewBadge" role="status">
                <img src="/dashboard-icons/Fund Transfer Active.svg" alt="" width={30} height={30} />
                <span>Review Transfer</span>
              </div>
            </div>

            <div className="transferFundsReviewSection">
              <h2 className="transferFundsReviewSectionTitle transferFundsReviewSectionTitle--receiver">
                Receiver Details
              </h2>
              <p className="transferFundsReviewFieldLabel">Phone Number</p>
              <p className="transferFundsReviewFieldValue">{phoneDisplay}</p>
            </div>

            <div className="transferFundsReviewDivider" aria-hidden="true" />

            <div className="transferFundsReviewSection">
              <h2 className="transferFundsReviewSectionTitle">Amount</h2>
              <p className="transferFundsReviewFieldValue transferFundsReviewFieldValue--solo">{amountDisplay}</p>
            </div>

            <div className="transferFundsReviewDivider" aria-hidden="true" />

            <div className="transferFundsReviewSection">
              <h2 className="transferFundsReviewSectionTitle">Transfer Charges</h2>
              <p className="transferFundsReviewFieldValue transferFundsReviewFieldValue--solo">{chargesDisplay}</p>
            </div>

            <div className="transferFundsReviewDivider" aria-hidden="true" />

            <div className="transferFundsReviewSection">
              <h2 className="transferFundsReviewSectionTitle">Transaction Category</h2>
              {categoryMeta ? (
                <span className={`transferFundsCatPill ${categoryMeta.pillClass} transferFundsReviewCatPill`}>
                  {categoryMeta.label}
                </span>
              ) : (
                <p className="transferFundsReviewFieldValue transferFundsReviewFieldValue--muted">Not selected</p>
              )}
            </div>

            <div className="transferFundsNextWrap">
              <button
                type="button"
                className={`contributionsExportButton transferFundsNextButton${sendMoneyPhaseClass(sendPhase)}`}
                disabled={sendPhase === 'processing' || sendPhase === 'sent'}
                aria-busy={sendPhase === 'processing'}
                aria-live="polite"
                title={failureDetail ?? undefined}
                onClick={handleSendMoney}
              >
                {sendMoneyLabel(sendPhase)}
              </button>
              {sendPhase === 'failed' && failureDetail != null ? (
                <p className="transferFundsSendError" role="alert">
                  {failureDetail}
                </p>
              ) : null}
            </div>
          </div>
        </article>
      </div>
    </DashboardChrome>
  )
}
