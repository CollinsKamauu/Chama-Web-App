import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import AuthHeroFeatures from './AuthHeroFeatures'
import './AuthPages.css'

const chamaBrandLogoUrl = new URL('../assets/auth/Chama App Demo Logo.svg', import.meta.url).href
const eyeUrl = new URL('../assets/auth/Eye.svg', import.meta.url).href

export default function SignupPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  /** Captured for future invite-code API; not sent on register yet. */
  const [inviteCode, setInviteCode] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await api.post('/api/auth/register', { name: name.trim(), email: email.trim(), password })
      if (data.success) {
        navigate('/login?registered=1', { replace: true })
      } else {
        setError(data.message ?? 'Registration failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="authPage authPage--signup">
      <div className="authFormSide">
        <div className="authBrand">
          <img className="authLogo authLogo--signupBrand" src={chamaBrandLogoUrl} alt="" width={120} height={120} />
          <h1 className="authAppName">Chama App</h1>
          <p className="authTagline">Pamoja Twaweza</p>
        </div>

        <form className="authForm" onSubmit={handleRegister} noValidate>
          {error ? <div className="authError">{error}</div> : null}

          <div className="authField">
            <label className="authLabel" htmlFor="signup-name">
              Name
            </label>
            <input
              id="signup-name"
              className="authInput"
              type="text"
              autoComplete="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="authField">
            <label className="authLabel" htmlFor="signup-email">
              Email address
            </label>
            <input
              id="signup-email"
              className="authInput"
              type="email"
              autoComplete="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="authField">
            <label className="authLabel" htmlFor="signup-invite-code">
              Invite Code
            </label>
            <input
              id="signup-invite-code"
              className="authInput"
              type="text"
              autoComplete="off"
              placeholder="Enter your invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
          </div>

          <div className="authField">
            <label className="authLabel" htmlFor="signup-password">
              Password
            </label>
            <div className="authInputWrap">
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <button
                type="button"
                className="authEye"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
              >
                <img src={eyeUrl} alt="" />
              </button>
            </div>
          </div>

          <button className="authSubmit" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="authSpinner" aria-hidden="true" />
                Creating account...
              </>
            ) : (
              'Sign up'
            )}
          </button>
        </form>

        <p className="authFooterLink">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>

      <AuthHeroFeatures />
    </div>
  )
}
