import { type MouseEvent, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DashboardChrome } from '../components/DashboardChrome'
import { useAuth } from '../context/AuthContext'
import {
  b2cRegisteredUserTransferFee,
  parseTransferAmountInput,
  TRANSFER_CATEGORIES,
  type TransferFundsReviewState,
} from '../lib/transferFunds/transferModel'
import '../App.css'

const MOCK_BALANCE = 469_560

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

export default function TransferFundsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const seed = (location.state as TransferFundsReviewState | null) ?? null
  const { displayName, logout } = useAuth()
  const profileName = displayName || 'John Doe'

  const [balanceVisible, setBalanceVisible] = useState(false)
  const [phone, setPhone] = useState(() => seed?.phone ?? '')
  const [amount, setAmount] = useState(() => seed?.amount ?? '')
  const [categoryId, setCategoryId] = useState<string | null>(() => seed?.categoryId ?? null)

  const handleLogout = (evt?: MouseEvent<HTMLButtonElement>) => {
    evt?.preventDefault()
    localStorage.removeItem('chama_token')
    logout()
    navigate('/login', { replace: true })
  }

  const parsedAmount = useMemo(() => parseTransferAmountInput(amount), [amount])

  const canGoToReview = phone.trim().length > 0 && parsedAmount != null

  const handleNext = () => {
    if (!canGoToReview) return
    navigate('/transfer-funds/review', {
      state: { phone, amount, categoryId } satisfies TransferFundsReviewState,
    })
  }

  const chargesPreview = useMemo(() => {
    if (parsedAmount == null) return null
    return b2cRegisteredUserTransferFee(parsedAmount)
  }, [parsedAmount])

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
              <p className="transferFundsBalanceAmount" aria-live="polite">
                {balanceVisible ? `KES ${MOCK_BALANCE.toLocaleString('en-US')}` : 'KES ********'}
              </p>
            </div>
          </div>
        </article>

        <article className="transferFundsFormCard">
          <div className="financesStatementAccent" aria-hidden="true" />
          <div className="transferFundsFormBody">
            <div className="transferFundsModeRow">
              <button type="button" className="transferFundsModeButton">
                <img src="/dashboard-icons/Fund Transfer Inactive.svg" alt="" width={30} height={30} />
                Transfer Funds to Phone Number
              </button>
            </div>

            <section className="transferFundsSection" aria-labelledby="transfer-receiver-heading">
              <h2 id="transfer-receiver-heading" className="transferFundsSectionTitle">
                Receiver Details
              </h2>
              <div className="membersModalField">
                <label htmlFor="transfer-phone">Phone Number</label>
                <input
                  id="transfer-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </section>

            <section className="transferFundsSection" aria-labelledby="transfer-amount-heading">
              <h2 id="transfer-amount-heading" className="transferFundsSectionTitle">
                Amount
              </h2>
              <div className="transferFundsAmountGrid">
                <div className="membersModalField">
                  <label htmlFor="transfer-amount">KES</label>
                  <input
                    id="transfer-amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="Enter Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="membersModalField transferFundsChargesField">
                  <span className="transferFundsChargesLabel">Transfer charges</span>
                  <div className="transferFundsChargesBox" aria-live="polite">
                    {chargesPreview != null ? (
                      <span className="transferFundsChargesValue">KES {chargesPreview.toLocaleString('en-US')}</span>
                    ) : (
                      <span className="transferFundsChargesPlaceholder">KES ··················</span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="transferFundsSection" aria-labelledby="transfer-category-heading">
              <h2 id="transfer-category-heading" className="transferFundsSectionTitle">
                Transaction Category <span className="transferFundsOptional">(optional)</span>
              </h2>
              <p className="transferFundsCategoryHint">Select category</p>
              <div className="transferFundsCatRow" role="group" aria-label="Transaction category">
                {TRANSFER_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`transferFundsCatPill ${c.pillClass}${categoryId === c.id ? ' transferFundsCatPill--selected' : ''}`}
                    aria-pressed={categoryId === c.id}
                    onClick={() => setCategoryId((prev) => (prev === c.id ? null : c.id))}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </section>

            <div className="transferFundsNextWrap">
              <button
                type="button"
                className="contributionsExportButton transferFundsNextButton"
                disabled={!canGoToReview}
                onClick={handleNext}
              >
                Next
              </button>
            </div>
          </div>
        </article>
      </div>
    </DashboardChrome>
  )
}

