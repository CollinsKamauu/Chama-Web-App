import { type MouseEvent, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardChrome } from '../components/DashboardChrome'
import { useAuth } from '../context/AuthContext'
import {
  revokeUserAccessStub,
  updateAccountEmailStub,
  updateChamaNameStub,
} from '../lib/settings/settingsActionsStub'
import '../App.css'

type SettingsActionPhase = 'idle' | 'pending' | 'done' | 'error'

function settingsActionPhaseClass(phase: SettingsActionPhase): string {
  if (phase === 'pending') return ' settingsActionButton--pending'
  if (phase === 'done') return ' settingsActionButton--done'
  if (phase === 'error') return ' settingsActionButton--error'
  return ''
}

function settingsActionLabel(phase: SettingsActionPhase): string {
  if (phase === 'pending') return 'Processing'
  if (phase === 'done') return 'Done'
  if (phase === 'error') return 'Error'
  return 'Confirm'
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { displayName, logout, chamaOrganizationName, setChamaOrganizationName } = useAuth()
  const profileName = displayName || 'John Doe'

  const [chamaName, setChamaName] = useState(chamaOrganizationName)
  const [accountEmail, setAccountEmail] = useState('')
  const [revokeUserName, setRevokeUserName] = useState('')
  const [revokeUserEmail, setRevokeUserEmail] = useState('')

  const [chamaPhase, setChamaPhase] = useState<SettingsActionPhase>('idle')
  const [emailPhase, setEmailPhase] = useState<SettingsActionPhase>('idle')
  const [revokePhase, setRevokePhase] = useState<SettingsActionPhase>('idle')

  const firstSectionRef = useRef<HTMLElement | null>(null)

  const handleLogout = (evt?: MouseEvent<HTMLButtonElement>) => {
    evt?.preventDefault()
    localStorage.removeItem('chama_token')
    logout()
    navigate('/login', { replace: true })
  }

  const scrollToAccountSections = () => {
    firstSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleChamaNameChange = (value: string) => {
    setChamaName(value)
    if (chamaPhase === 'done' || chamaPhase === 'error') setChamaPhase('idle')
  }

  const handleAccountEmailChange = (value: string) => {
    setAccountEmail(value)
    if (emailPhase === 'done' || emailPhase === 'error') setEmailPhase('idle')
  }

  const handleRevokeNameChange = (value: string) => {
    setRevokeUserName(value)
    if (revokePhase === 'done' || revokePhase === 'error') setRevokePhase('idle')
  }

  const handleRevokeEmailChange = (value: string) => {
    setRevokeUserEmail(value)
    if (revokePhase === 'done' || revokePhase === 'error') setRevokePhase('idle')
  }

  const handleChamaConfirm = async () => {
    if (chamaPhase === 'pending' || chamaPhase === 'done') return
    setChamaPhase('pending')
    try {
      const { ok } = await updateChamaNameStub(chamaName)
      if (ok) {
        setChamaOrganizationName(chamaName)
      }
      setChamaPhase(ok ? 'done' : 'error')
    } catch {
      setChamaPhase('error')
    }
  }

  const handleEmailConfirm = async () => {
    if (emailPhase === 'pending' || emailPhase === 'done') return
    setEmailPhase('pending')
    try {
      const { ok } = await updateAccountEmailStub(accountEmail)
      setEmailPhase(ok ? 'done' : 'error')
    } catch {
      setEmailPhase('error')
    }
  }

  const handleRevokeConfirm = async () => {
    if (revokePhase === 'pending' || revokePhase === 'done') return
    setRevokePhase('pending')
    try {
      const { ok } = await revokeUserAccessStub(revokeUserName, revokeUserEmail)
      setRevokePhase(ok ? 'done' : 'error')
    } catch {
      setRevokePhase('error')
    }
  }

  return (
    <DashboardChrome profileName={profileName} onLogout={handleLogout}>
      <div className="mainContent contributionsMain settingsPageMain">
        <article className="contributionsReportCard settingsHeroCard">
          <div className="settingsHeroRow">
            <div className="contributionsReportIconWrap settingsHeroIconWrap" aria-hidden="true">
              <img src="/dashboard-icons/Settings Active.svg" alt="" />
            </div>
            <div className="contributionsReportHeadingText">
              <h1 className="contributionsReportTitle">Settings</h1>
              <p className="contributionsReportMeta">Manage your account settings</p>
            </div>
          </div>
        </article>

        <article className="transferFundsFormCard settingsFormCard">
          <div className="financesStatementAccent" aria-hidden="true" />
          <div className="transferFundsFormBody settingsFormBody">
            <div className="settingsManageRow">
              <button type="button" className="transferFundsModeButton settingsManageAccountButton" onClick={scrollToAccountSections}>
                <img src="/dashboard-icons/Settings Inactive.svg" alt="" width={28} height={28} />
                Manage your Account
              </button>
            </div>

            <section ref={firstSectionRef} className="settingsFormSection" aria-labelledby="settings-chama-heading">
              <h2 id="settings-chama-heading" className="settingsFormSectionTitle">
                Change Chama Name
              </h2>
              <p className="settingsFormSectionHint">Edit your Chama name on this site</p>
              <div className="membersModalField settingsFieldBlock">
                <input
                  id="settings-chama-name"
                  type="text"
                  autoComplete="organization"
                  placeholder="Enter name"
                  value={chamaName}
                  onChange={(e) => handleChamaNameChange(e.target.value)}
                  aria-label="Chama name"
                />
              </div>
              <button
                type="button"
                className={`contributionsExportButton settingsActionButton${settingsActionPhaseClass(chamaPhase)}`}
                disabled={chamaPhase === 'pending' || chamaPhase === 'done'}
                aria-busy={chamaPhase === 'pending'}
                aria-live="polite"
                onClick={handleChamaConfirm}
              >
                {settingsActionLabel(chamaPhase)}
              </button>
            </section>

            <section className="settingsFormSection" aria-labelledby="settings-email-heading">
              <h2 id="settings-email-heading" className="settingsFormSectionTitle">
                Update your Email address
              </h2>
              <p className="settingsFormSectionHint">Edit your email address</p>
              <div className="membersModalField settingsFieldBlock">
                <input
                  id="settings-account-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter email address"
                  value={accountEmail}
                  onChange={(e) => handleAccountEmailChange(e.target.value)}
                  aria-label="Email address"
                />
              </div>
              <button
                type="button"
                className={`contributionsExportButton settingsActionButton${settingsActionPhaseClass(emailPhase)}`}
                disabled={emailPhase === 'pending' || emailPhase === 'done'}
                aria-busy={emailPhase === 'pending'}
                aria-live="polite"
                onClick={handleEmailConfirm}
              >
                {settingsActionLabel(emailPhase)}
              </button>
            </section>

            <section className="settingsFormSection" aria-labelledby="settings-revoke-heading">
              <h2 id="settings-revoke-heading" className="settingsFormSectionTitle">
                Revoke User Access
              </h2>
              <p className="settingsFormSectionHint">Remove an existing user from accessing your Chama App</p>
              <div className="membersModalField settingsFieldBlock">
                <label htmlFor="settings-revoke-name">Name of User</label>
                <input
                  id="settings-revoke-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter their name"
                  value={revokeUserName}
                  onChange={(e) => handleRevokeNameChange(e.target.value)}
                />
              </div>
              <div className="membersModalField settingsFieldBlock">
                <label htmlFor="settings-revoke-email">Email address of User</label>
                <input
                  id="settings-revoke-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter their email address"
                  value={revokeUserEmail}
                  onChange={(e) => handleRevokeEmailChange(e.target.value)}
                />
              </div>
              <button
                type="button"
                className={`contributionsExportButton settingsActionButton${settingsActionPhaseClass(revokePhase)}`}
                disabled={revokePhase === 'pending' || revokePhase === 'done'}
                aria-busy={revokePhase === 'pending'}
                aria-live="polite"
                onClick={handleRevokeConfirm}
              >
                {settingsActionLabel(revokePhase)}
              </button>
            </section>
          </div>
        </article>
      </div>
    </DashboardChrome>
  )
}
