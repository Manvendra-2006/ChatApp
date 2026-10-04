import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import useAuth from '../hooks/useAuth'
import { requestOtp } from '../services/authService'

export default function Login() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  if (!loading && user) return <Navigate to="/chat" replace />

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSending(true)
    const normalizedEmail = email.trim().toLowerCase()

    try {
      await requestOtp(normalizedEmail)
      sessionStorage.setItem('chatapp-otp-email', normalizedEmail)
      sessionStorage.setItem('chatapp-otp-requested-at', String(Date.now()))
      navigate('/verify-otp', { state: { email: normalizedEmail } })
    } catch (requestError) {
      setError(
        requestError.status === 429
          ? 'You’ve requested a code recently. Please wait about a minute before trying again.'
          : requestError.message,
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-visual" aria-label="ChatApp introduction">
        <Link className="brand brand-light" to="/login">
          <span className="brand-mark"><Icon name="message" size={22} /></span>
          <span>Chat<span className="brand-accent">App</span></span>
        </Link>
        <div className="visual-copy">
          <span className="eyebrow">A little closer, every day</span>
          <h1>Good conversations<br />make good days.</h1>
          <p>Your people, your messages, all in one calm place.</p>
        </div>
        <div className="visual-art" aria-hidden="true">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-message art-message-top">
            <span className="art-avatar art-avatar-peach">J</span>
            <span><b>Jamie</b><small>Made it home ✨</small></span>
            <i>now</i>
          </div>
          <div className="art-message art-message-bottom">
            <span className="art-avatar art-avatar-mint">Y</span>
            <span><b>You</b><small>That was lovely!</small></span>
            <span className="art-check">✓✓</span>
          </div>
          <div className="art-sparkle sparkle-one">✳</div>
          <div className="art-sparkle sparkle-two">✦</div>
        </div>
        <div className="visual-foot"><span /> Built for your everyday moments</div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <Link className="brand brand-mobile" to="/login">
            <span className="brand-mark"><Icon name="message" size={22} /></span>
            <span>Chat<span className="brand-accent">App</span></span>
          </Link>
          <span className="auth-kicker">WELCOME BACK</span>
          <h2>Let’s get you<br className="desktop-break" /> back in.</h2>
          <p className="auth-intro">Enter your email and we’ll send you a one-time sign-in code.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Email address</label>
            <div className="input-with-icon">
              <Icon name="mail" size={19} />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button auth-submit" type="submit" disabled={sending}>
              {sending ? <><span className="spinner spinner-light" /> Sending code…</> : <>Send me a code <span>→</span></>}
            </button>
          </form>
          <div className="auth-assurance"><Icon name="lock" size={15} /> Secure sign-in, no password needed</div>
          <p className="auth-signup-note">New to ChatApp? <span>Your account is created when you verify your email.</span></p>
        </div>
        <footer className="auth-footer">© 2026 ChatApp <span>·</span> Made for meaningful conversations</footer>
      </section>
    </main>
  )
}
