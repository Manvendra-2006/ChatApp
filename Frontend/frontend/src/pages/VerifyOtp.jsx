// import { useEffect, useRef, useState } from 'react'
// import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
// import Icon from '../components/Icon'
// import useAuth from '../hooks/useAuth'
// import { requestOtp } from '../services/authService'

// const RESEND_DELAY_MS = 60_000

// export default function VerifyOtp() {
//   const location = useLocation()
//   const navigate = useNavigate()
//   const { user, loading: authLoading, verify } = useAuth()
//   const email =
//     location.state?.email || sessionStorage.getItem('chatapp-otp-email') || ''
//   const [code, setCode] = useState('')
//   const [error, setError] = useState('')
//   const [verifying, setVerifying] = useState(false)
//   const [resending, setResending] = useState(false)
//   const [now, setNow] = useState(Date.now())
//   const inputRef = useRef(null)

//   useEffect(() => {
//     const timer = window.setInterval(() => setNow(Date.now()), 1000)
//     return () => window.clearInterval(timer)
//   }, [])

//   if (!authLoading && user) return <Navigate to="/chat" replace />
//   if (!email) return <Navigate to="/login" replace />

//   const requestedAt = Number(sessionStorage.getItem('chatapp-otp-requested-at')) || now
//   const secondsLeft = Math.max(
//     0,
//     Math.ceil((requestedAt + RESEND_DELAY_MS - now) / 1000),
//   )

//   const handleVerify = async (event) => {
//     event.preventDefault()
//     if (code.length !== 6) {
//       setError('Enter the 6-digit code from your email.')
//       inputRef.current?.focus()
//       return
//     }

//     setError('')
//     setVerifying(true)
//     try {
//       await verify(email, code)
//       sessionStorage.removeItem('chatapp-otp-email')
//       sessionStorage.removeItem('chatapp-otp-requested-at')
//       navigate('/chat', { replace: true })
//     } catch (verificationError) {
//       setError(
//         verificationError.status === 400
//           ? 'That code is invalid or has expired. Check your email and try again.'
//           : verificationError.message,
//       )
//       setCode('')
//       inputRef.current?.focus()
//     } finally {
//       setVerifying(false)
//     }
//   }

//   const handleResend = async () => {
//     setError('')
//     setResending(true)
//     try {
//       await requestOtp(email)
//       sessionStorage.setItem('chatapp-otp-requested-at', String(Date.now()))
//       setCode('')
//       setNow(Date.now())
//       inputRef.current?.focus()
//     } catch (resendError) {
//       setError(
//         resendError.status === 429
//           ? 'Please wait a little longer before requesting another code.'
//           : resendError.message,
//       )
//       if (resendError.status === 429) {
//         sessionStorage.setItem('chatapp-otp-requested-at', String(Date.now()))
//         setNow(Date.now())
//       }
//     } finally {
//       setResending(false)
//     }
//   }

//   return (
//     <main className="auth-screen otp-screen">
//       <section className="auth-visual" aria-label="ChatApp introduction">
//         <Link className="brand brand-light" to="/login">
//           <span className="brand-mark"><Icon name="message" size={22} /></span>
//           <span>Chat<span className="brand-accent">App</span></span>
//         </Link>
//         <div className="visual-copy">
//           <span className="eyebrow">One quick check</span>
//           <h1>Your inbox is<br />the key.</h1>
//           <p>A simple, secure way to make sure it’s really you.</p>
//         </div>
//         <div className="otp-illustration" aria-hidden="true">
//           <span className="otp-illustration-icon"><Icon name="mail" size={38} /></span>
//           <span className="otp-illustration-dot dot-a" />
//           <span className="otp-illustration-dot dot-b" />
//           <span className="otp-illustration-dot dot-c" />
//         </div>
//         <div className="visual-foot"><span /> Your code is valid for 5 minutes</div>
//       </section>

//       <section className="auth-form-panel">
//         <div className="auth-form-wrap otp-form-wrap">
//           <Link className="brand brand-mobile" to="/login">
//             <span className="brand-mark"><Icon name="message" size={22} /></span>
//             <span>Chat<span className="brand-accent">App</span></span>
//           </Link>
//           <Link className="back-link" to="/login" state={{ email }}>
//             <Icon name="arrow" size={17} /> Change email
//           </Link>
//           <span className="auth-kicker">CHECK YOUR INBOX</span>
//           <h2>Enter your<br className="desktop-break" /> verification code.</h2>
//           <p className="auth-intro">We’ve sent a 6-digit code to <strong>{email}</strong>.</p>

//           <form className="auth-form" onSubmit={handleVerify}>
//             <label htmlFor="otp">6-digit code</label>
//             <div className="otp-input-wrap">
//               <input
//                 ref={inputRef}
//                 id="otp"
//                 className="otp-input"
//                 type="text"
//                 inputMode="numeric"
//                 autoComplete="one-time-code"
//                 autoFocus
//                 maxLength={6}
//                 pattern="[0-9]{6}"
//                 placeholder="••••••"
//                 aria-describedby={error ? 'otp-error' : undefined}
//                 value={code}
//                 onChange={(event) => {
//                   setError('')
//                   setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
//                 }}
//                 onPaste={(event) => {
//                   const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
//                   if (pasted) {
//                     event.preventDefault()
//                     setCode(pasted)
//                     setError('')
//                   }
//                 }}
//                 required
//               />
//               <span className="otp-digit-count">{code.length}/6</span>
//             </div>
//             {error && <p className="form-error" id="otp-error" role="alert">{error}</p>}
//             <button className="primary-button auth-submit" type="submit" disabled={verifying}>
//               {verifying ? <><span className="spinner spinner-light" /> Verifying…</> : <>Verify and continue <span>→</span></>}
//             </button>
//           </form>
//           <div className="resend-row">
//             <span>Didn’t get the email?</span>
//             <button
//               type="button"
//               className="text-button"
//               onClick={handleResend}
//               disabled={resending || secondsLeft > 0}
//             >
//               {resending ? 'Sending…' : secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend code'}
//             </button>
//           </div>
//           <div className="auth-assurance"><Icon name="lock" size={15} /> Never share your code with anyone</div>
//         </div>
//         <footer className="auth-footer">© 2026 ChatApp <span>·</span> Made for meaningful conversations</footer>
//       </section>
//     </main>
//   )
// }
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import useAuth from '../hooks/useAuth'
import { requestOtp } from '../services/authService'

const RESEND_DELAY_MS = 60_000

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
  )
}

function Brand({ className = '' }) {
  return (
    <Link className={`items-center gap-3 text-xl font-bold text-white ${className}`} to="/login">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-400 to-indigo-500 text-white shadow-lg shadow-fuchsia-900/30">
        <Icon name="message" size={22} />
      </span>
      <span>
        Chat<span className="bg-gradient-to-r from-cyan-200 to-pink-200 bg-clip-text text-transparent">App</span>
      </span>
    </Link>
  )
}

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
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 p-4 md:p-8">
      {/* decorative blurred blobs, give the glass something to blur */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-cyan-400/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-[28rem] w-[28rem] rounded-full bg-pink-500/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-10 h-80 w-80 rounded-full bg-indigo-400/40 blur-3xl" />

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl shadow-black/30 backdrop-blur-2xl lg:grid-cols-2">
        {/* ---------------- left: intro + art ---------------- */}
        <section
          className="relative hidden flex-col justify-between gap-8 border-r border-white/15 bg-white/5 p-10 lg:flex"
          aria-label="ChatApp introduction"
        >
          <Brand className="flex" />

          <div className="text-white">
            <span className="text-sm font-medium text-cyan-200">One quick check</span>
            <h1 className="mt-3 text-4xl font-bold leading-tight">
              Your inbox is<br />the key.
            </h1>
            <p className="mt-3 max-w-xs text-white/70">A simple, secure way to make sure it’s really you.</p>
          </div>

          <div className="relative grid h-48 place-items-center" aria-hidden="true">
            <div className="absolute h-40 w-40 rounded-full bg-gradient-to-br from-fuchsia-400/50 to-cyan-400/50 blur-2xl" />
            <span className="relative grid h-24 w-24 place-items-center rounded-3xl border border-white/30 bg-white/15 text-white shadow-xl shadow-black/20 backdrop-blur-md">
              <Icon name="mail" size={38} />
            </span>
            <span className="absolute left-10 top-6 h-3 w-3 rounded-full bg-cyan-300/80 shadow-[0_0_10px_2px_rgba(103,232,249,0.6)]" />
            <span className="absolute bottom-8 right-12 h-4 w-4 rounded-full bg-pink-300/80 shadow-[0_0_10px_2px_rgba(249,168,212,0.6)]" />
            <span className="absolute right-20 top-4 h-2 w-2 rounded-full bg-yellow-200/90" />
          </div>

          <div className="flex items-center gap-2 text-sm text-white/60">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.7)]" />
            Your code is valid for 5 minutes
          </div>
        </section>

        {/* ---------------- right: form ---------------- */}
        <section className="flex flex-col justify-between p-6 sm:p-10">
          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-4">
            <Brand className="mb-8 flex lg:hidden" />
            <Link
              className="mb-6 inline-flex w-fit items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white/80 transition hover:bg-white/20 hover:text-white"
              to="/login"
              state={{ email }}
            >
              <Icon name="arrow" size={17} className="rotate-180" /> Change email
            </Link>
            <span className="text-xs font-semibold tracking-[0.25em] text-cyan-200">CHECK YOUR INBOX</span>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-white">
              Enter your<br className="hidden sm:block" /> verification code.
            </h2>
            <p className="mt-3 text-sm text-white/70">
              We’ve sent a 6-digit code to <strong className="break-all font-semibold text-white">{email}</strong>.
            </p>

            <form className="mt-8 flex flex-col gap-3" onSubmit={handleVerify}>
              <label className="text-sm font-medium text-white/90" htmlFor="otp">6-digit code</label>
              <div className="relative">
                <input
                  ref={inputRef}
                  id="otp"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-4 text-center font-mono text-3xl tracking-[0.5em] text-white outline-none transition placeholder:text-white/30 focus:border-white/50 focus:bg-white/15 focus:shadow-lg focus:shadow-fuchsia-900/20"
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
                <span className="pointer-events-none absolute bottom-1.5 right-3 text-[11px] text-white/50">{code.length}/6</span>
              </div>
              {error && (
                <p className="rounded-xl border border-rose-300/40 bg-rose-500/20 px-4 py-2 text-sm text-rose-100" id="otp-error" role="alert">{error}</p>
              )}
              <button
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-6 py-3.5 font-semibold text-white shadow-xl shadow-fuchsia-900/30 transition hover:scale-[1.02] hover:shadow-fuchsia-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                type="submit"
                disabled={verifying}
              >
                {verifying ? <><Spinner /> Verifying…</> : <>Verify and continue <span>→</span></>}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-center gap-2 text-sm text-white/70">
              <span>Didn’t get the email?</span>
              <button
                type="button"
                className="rounded-lg bg-white/10 px-3 py-1 text-sm font-medium text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:text-white/40 disabled:hover:bg-white/10"
                onClick={handleResend}
                disabled={resending || secondsLeft > 0}
              >
                {resending ? 'Sending…' : secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend code'}
              </button>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/60">
              <Icon name="lock" size={15} /> Never share your code with anyone
            </div>
          </div>

          <footer className="mt-6 text-center text-xs text-white/40">
            © 2026 ChatApp <span>·</span> Made for meaningful conversations
          </footer>
        </section>
      </div>
    </main>
  )
}