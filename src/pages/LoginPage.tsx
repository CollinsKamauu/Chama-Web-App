import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
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

export default function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const registered = params.get('registered') === '1'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await api.post('/api/auth/login', { email: email.trim(), password })
      if (data.success && typeof data.token === 'string') {
        localStorage.setItem('chama_token', data.token)
        localStorage.setItem('chama_email', email.trim())
        navigate('/', { replace: true })
        window.location.reload()
      } else {
        setError(data.message ?? 'Login failed')
      }
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

        <form className="authForm" onSubmit={handleLogin} noValidate>
          {registered ? (
            <p className="authError" style={{ background: 'rgba(32, 112, 210, 0.1)', color: '#1a5cb3' }}>
              Account created. Log in with your email and password.
            </p>
          ) : null}
          {error ? <div className="authError">{error}</div> : null}

          <div className="authField">
            <label className="authLabel" htmlFor="login-email">
              Email address
            </label>
            <input
              id="login-email"
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
            <label className="authLabel" htmlFor="login-password">
              Password
            </label>
            <div className="authInputWrap">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
                Logging in...
              </>
            ) : (
              'Log in'
            )}
          </button>
        </form>

        <p className="authFooterLink">
          Don&apos;t have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>

      <AuthHero />
    </div>
  )
}
