import { type MouseEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardChrome } from '../components/DashboardChrome'
import { useAuth } from '../context/AuthContext'
import { confirmInviteStub, generateInviteCodeStub } from '../lib/inviteCode/inviteCodeActionsStub'
import '../App.css'

type ConfirmPhase = 'idle' | 'pending' | 'done' | 'error'

function confirmPhaseClass(phase: ConfirmPhase): string {
  if (phase === 'pending') return ' settingsActionButton--pending'
  if (phase === 'done') return ' settingsActionButton--done'
  if (phase === 'error') return ' settingsActionButton--error'
  return ''
}

function confirmLabel(phase: ConfirmPhase): string {
  if (phase === 'pending') return 'Processing'
  if (phase === 'done') return 'Code Generated'
  if (phase === 'error') return 'Error'
  return 'Confirm'
}

export default function CreateInviteCodePage() {
  const navigate = useNavigate()
  const { displayName, chamaOrganizationName, logout } = useAuth()
  const profileName = displayName || 'John Doe'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [generateBusy, setGenerateBusy] = useState(false)
  const [confirmPhase, setConfirmPhase] = useState<ConfirmPhase>('idle')

  const handleLogout = (evt?: MouseEvent<HTMLButtonElement>) => {
    evt?.preventDefault()
    localStorage.removeItem('chama_token')
    logout()
    navigate('/login', { replace: true })
  }

  const handleGenerate = async () => {
    if (generateBusy || confirmPhase === 'done') return
    setGenerateBusy(true)
    try {
      const { code } = await generateInviteCodeStub()
      setGeneratedCode(code)
      if (confirmPhase === 'error') setConfirmPhase('idle')
    } finally {
      setGenerateBusy(false)
    }
  }

  const handleConfirm = async () => {
    if (confirmPhase === 'pending' || confirmPhase === 'done') return
    if (!generatedCode) return
    if (!name.trim() || !email.trim()) return
    setConfirmPhase('pending')
    try {
      const { ok } = await confirmInviteStub(name.trim(), email.trim(), generatedCode)
      setConfirmPhase(ok ? 'done' : 'error')
    } catch {
      setConfirmPhase('error')
    }
  }

  const onNameChange = (v: string) => {
    setName(v)
    if (confirmPhase === 'done' || confirmPhase === 'error') setConfirmPhase('idle')
  }

  const onEmailChange = (v: string) => {
    setEmail(v)
    if (confirmPhase === 'done' || confirmPhase === 'error') setConfirmPhase('idle')
  }

  return (
    <DashboardChrome profileName={profileName} onLogout={handleLogout}>
      <div className="mainContent contributionsMain settingsPageMain inviteCodePageMain">
        <article className="contributionsReportCard settingsHeroCard">
          <div className="settingsHeroRow">
            <div className="contributionsReportIconWrap settingsHeroIconWrap" aria-hidden="true">
              <img src="/dashboard-icons/Invite Code Active.svg" alt="" />
            </div>
            <div className="contributionsReportHeadingText">
              <h1 className="contributionsReportTitle">Create Invite Code</h1>
              <p className="contributionsReportMeta">Manage who can access your Chama App</p>
            </div>
          </div>
        </article>

        <p className="inviteCodeIntro">
          Generate an invite code to add a new admin to {chamaOrganizationName} Chama App.
        </p>

        <article className="transferFundsFormCard settingsFormCard">
          <div className="financesStatementAccent" aria-hidden="true" />
          <div className="transferFundsFormBody settingsFormBody inviteCodeFormBody">
            <div className="inviteCodeGenerateRow">
              <button
                type="button"
                className="transferFundsModeButton inviteCodeGenerateButton"
                onClick={handleGenerate}
                disabled={generateBusy || confirmPhase === 'done'}
                aria-busy={generateBusy}
              >
                <img src="/dashboard-icons/Invite Code.svg" alt="" width={28} height={28} />
                {generateBusy ? 'Generating…' : 'Generate Invite Code'}
              </button>
            </div>

            {generatedCode ? (
              <div className="inviteCodeDisplay" aria-live="polite">
                <span className="inviteCodeDisplayLabel">Invite code</span>
                <code className="inviteCodeDisplayValue">{generatedCode}</code>
              </div>
            ) : null}

            <section className="settingsFormSection inviteCodeFormSection" aria-labelledby="invite-name-heading">
              <h2 id="invite-name-heading" className="settingsFormSectionTitle">
                Name
              </h2>
              <p className="settingsFormSectionHint">Enter the name of the person you want to grant access</p>
              <div className="membersModalField settingsFieldBlock">
                <input
                  id="invite-name"
                  type="text"
                  autoComplete="name"
                  placeholder="First & Last Names"
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  disabled={confirmPhase === 'done'}
                  aria-label="Name"
                />
              </div>
            </section>

            <section className="settingsFormSection inviteCodeFormSection" aria-labelledby="invite-email-heading">
              <h2 id="invite-email-heading" className="settingsFormSectionTitle">
                Email address
              </h2>
              <p className="settingsFormSectionHint">Enter the email address of the person you want to grant access</p>
              <div className="membersModalField settingsFieldBlock">
                <input
                  id="invite-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter their email address"
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  disabled={confirmPhase === 'done'}
                  aria-label="Email address"
                />
              </div>
            </section>

            <div className="inviteCodeConfirmRow">
              <button
                type="button"
                className={`contributionsExportButton settingsActionButton${confirmPhaseClass(confirmPhase)}`}
                disabled={
                  confirmPhase === 'pending' ||
                  confirmPhase === 'done' ||
                  !generatedCode ||
                  !name.trim() ||
                  !email.trim()
                }
                aria-busy={confirmPhase === 'pending'}
                aria-live="polite"
                onClick={handleConfirm}
              >
                {confirmLabel(confirmPhase)}
              </button>
            </div>
          </div>
        </article>
      </div>
    </DashboardChrome>
  )
}
