import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AuthPages.css'

const logoUrl = new URL('../assets/auth/Chama App Demo Logo 1.svg', import.meta.url).href
const eyeUrl = new URL('../assets/auth/Eye.svg', import.meta.url).href
const mpesaUrl = new URL('../assets/auth/Money Transfer Mpesa 1.svg', import.meta.url).href
const fileRecordUrl = new URL('../assets/auth/File Record 1.svg', import.meta.url).href
const exportUrl = new URL('../assets/icons/Export.svg', import.meta.url).href

function AuthHero() {
  return (
    <aside className="authHero" aria-label="Product features">
      <h2 className="authHeroTitle">The easiest way to manage your Chama</h2>
      <div className="authFeature">
        <img className="authFeatureIcon" src={mpesaUrl} alt="" />
        <p className="authFeatureText">M-Pesa Paybill and Till Automation</p>
      </div>
      <div className="authFeature">
        <img className="authFeatureIcon" src={fileRecordUrl} alt="" />
        <p className="authFeatureText">Record transactions</p>
      </div>
      <div className="authFeature">
        <img className="authFeatureIcon" src={exportUrl} alt="" />
        <p className="authFeatureText">Export and manage records</p>
      </div>
    </aside>
  )
}

export default function SignupPage() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signup(name.trim(), email.trim(), password)
      navigate('/login?registered=1', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="authPage">
      <div className="authFormSide">
        <div className="authBrand">
          <img className="authLogo" src={logoUrl} alt="" width={64} height={64} />
          <h1 className="authAppName">Chama App</h1>
          <p className="authTagline">Pamoja Twaweza</p>
        </div>

        <form className="authForm" onSubmit={handleSubmit} noValidate>
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
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <p className="authFooterLink">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>

      <AuthHero />
    </div>
  )
}
