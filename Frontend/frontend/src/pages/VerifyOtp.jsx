import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import useAuth from '../hooks/useAuth'
import { requestOtp } from '../services/authService'

const RESEND_DELAY_MS = 60_000

export default function VerifyOtp() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, loading: authLoading, verify } = useAuth()
  const email =
    location.state?.email || sessionStorage.getItem('chatapp-otp-email') || ''
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [now, setNow] = useState(Date.now())
  const inputRef = useRef(null)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  if (!authLoading && user) return <Navigate to="/chat" replace />
  if (!email) return <Navigate to="/login" replace />

  const requestedAt = Number(sessionStorage.getItem('chatapp-otp-requested-at')) || now
  const secondsLeft = Math.max(
    0,
    Math.ceil((requestedAt + RESEND_DELAY_MS - now) / 1000),
  )

  const handleVerify = async (event) => {
    event.preventDefault()
    if (code.length !== 6) {
      setError('Enter the 6-digit code from your email.')
      inputRef.current?.focus()
      return
    }

    setError('')
    setVerifying(true)
    try {
      await verify(email, code)
      sessionStorage.removeItem('chatapp-otp-email')
      sessionStorage.removeItem('chatapp-otp-requested-at')
      navigate('/chat', { replace: true })
    } catch (verificationError) {
      setError(
        verificationError.status === 400
          ? 'That code is invalid or has expired. Check your email and try again.'
          : verificationError.message,
      )
      setCode('')
      inputRef.current?.focus()
    } finally {
      setVerifying(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setResending(true)
    try {
      await requestOtp(email)
      sessionStorage.setItem('chatapp-otp-requested-at', String(Date.now()))
      setCode('')
      setNow(Date.now())
      inputRef.current?.focus()
    } catch (resendError) {
      setError(
        resendError.status === 429
          ? 'Please wait a little longer before requesting another code.'
          : resendError.message,
      )
      if (resendError.status === 429) {
        sessionStorage.setItem('chatapp-otp-requested-at', String(Date.now()))
        setNow(Date.now())
      }
    } finally {
      setResending(false)
    }
  }

  return (
    <main className="auth-screen otp-screen">
      <section className="auth-visual" aria-label="ChatApp introduction">
        <Link className="brand brand-light" to="/login">
          <span className="brand-mark"><Icon name="message" size={22} /></span>
          <span>Chat<span className="brand-accent">App</span></span>
        </Link>
        <div className="visual-copy">
          <span className="eyebrow">One quick check</span>
          <h1>Your inbox is<br />the key.</h1>
          <p>A simple, secure way to make sure it’s really you.</p>
        </div>
        <div className="otp-illustration" aria-hidden="true">
          <span className="otp-illustration-icon"><Icon name="mail" size={38} /></span>
          <span className="otp-illustration-dot dot-a" />
          <span className="otp-illustration-dot dot-b" />
          <span className="otp-illustration-dot dot-c" />
        </div>
        <div className="visual-foot"><span /> Your code is valid for 5 minutes</div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrap otp-form-wrap">
          <Link className="brand brand-mobile" to="/login">
            <span className="brand-mark"><Icon name="message" size={22} /></span>
            <span>Chat<span className="brand-accent">App</span></span>
          </Link>
          <Link className="back-link" to="/login" state={{ email }}>
            <Icon name="arrow" size={17} /> Change email
          </Link>
          <span className="auth-kicker">CHECK YOUR INBOX</span>
          <h2>Enter your<br className="desktop-break" /> verification code.</h2>
          <p className="auth-intro">We’ve sent a 6-digit code to <strong>{email}</strong>.</p>

          <form className="auth-form" onSubmit={handleVerify}>
            <label htmlFor="otp">6-digit code</label>
            <div className="otp-input-wrap">
              <input
                ref={inputRef}
                id="otp"
                className="otp-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="••••••"
                aria-describedby={error ? 'otp-error' : undefined}
                value={code}
                onChange={(event) => {
                  setError('')
                  setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                }}
                onPaste={(event) => {
                  const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
                  if (pasted) {
                    event.preventDefault()
                    setCode(pasted)
                    setError('')
                  }
                }}
                required
              />
              <span className="otp-digit-count">{code.length}/6</span>
            </div>
            {error && <p className="form-error" id="otp-error" role="alert">{error}</p>}
            <button className="primary-button auth-submit" type="submit" disabled={verifying}>
              {verifying ? <><span className="spinner spinner-light" /> Verifying…</> : <>Verify and continue <span>→</span></>}
            </button>
          </form>
          <div className="resend-row">
            <span>Didn’t get the email?</span>
            <button
              type="button"
              className="text-button"
              onClick={handleResend}
              disabled={resending || secondsLeft > 0}
            >
              {resending ? 'Sending…' : secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend code'}
            </button>
          </div>
          <div className="auth-assurance"><Icon name="lock" size={15} /> Never share your code with anyone</div>
        </div>
        <footer className="auth-footer">© 2026 ChatApp <span>·</span> Made for meaningful conversations</footer>
      </section>
    </main>
  )
}
