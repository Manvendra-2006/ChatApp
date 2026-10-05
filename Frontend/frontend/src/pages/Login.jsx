import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import useAuth from '../hooks/useAuth'
import { requestOtp } from '../services/authService'

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
            <span className="text-sm font-medium text-cyan-200">A little closer, every day</span>
            <h1 className="mt-3 text-4xl font-bold leading-tight">
              Good conversations<br />make good days.
            </h1>
            <p className="mt-3 max-w-xs text-white/70">Your people, your messages, all in one calm place.</p>
          </div>

          <div className="relative h-48" aria-hidden="true">
            <div className="absolute inset-x-6 inset-y-2 rounded-full bg-gradient-to-br from-fuchsia-400/40 to-cyan-400/40 blur-2xl" />
            <div className="absolute left-0 top-0 flex items-center gap-3 rounded-2xl rounded-bl-md border border-white/25 bg-white/15 px-4 py-3 text-white shadow-lg backdrop-blur-md">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-orange-300 to-pink-400 text-sm font-semibold">J</span>
              <span className="flex flex-col">
                <b className="text-sm font-semibold">Jamie</b>
                <small className="text-xs text-white/70">Made it home ✨</small>
              </span>
              <i className="ml-2 self-start text-[10px] not-italic text-white/60">now</i>
            </div>
            <div className="absolute bottom-0 right-0 flex items-center gap-3 rounded-2xl rounded-br-md border border-white/25 bg-gradient-to-br from-fuchsia-500/80 to-indigo-500/80 px-4 py-3 text-white shadow-lg">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-emerald-300 to-cyan-400 text-sm font-semibold">Y</span>
              <span className="flex flex-col">
                <b className="text-sm font-semibold">You</b>
                <small className="text-xs text-white/80">That was lovely!</small>
              </span>
              <span className="ml-2 self-end text-xs text-cyan-200">✓✓</span>
            </div>
            <span className="absolute right-12 top-2 text-2xl text-yellow-200">✳</span>
            <span className="absolute bottom-10 left-16 text-lg text-white/70">✦</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-white/60">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.7)]" />
            Built for your everyday moments
          </div>
        </section>

        {/* ---------------- right: form ---------------- */}
        <section className="flex flex-col justify-between p-6 sm:p-10">
          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-4">
            <Brand className="mb-8 flex lg:hidden" />
            <span className="text-xs font-semibold tracking-[0.25em] text-cyan-200">WELCOME BACK</span>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-white">
              Let’s get you<br className="hidden sm:block" /> back in.
            </h2>
            <p className="mt-3 text-sm text-white/70">Enter your email and we’ll send you a one-time sign-in code.</p>

            <form className="mt-8 flex flex-col gap-3" onSubmit={handleSubmit}>
              <label className="text-sm font-medium text-white/90" htmlFor="email">Email address</label>
              <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white/70 transition focus-within:border-white/50 focus-within:bg-white/15 focus-within:shadow-lg focus-within:shadow-fuchsia-900/20">
                <Icon name="mail" size={19} />
                <input
                  className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-white/40"
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="rounded-xl border border-rose-300/40 bg-rose-500/20 px-4 py-2 text-sm text-rose-100" role="alert">{error}</p>
              )}
              <button
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-6 py-3.5 font-semibold text-white shadow-xl shadow-fuchsia-900/30 transition hover:scale-[1.02] hover:shadow-fuchsia-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                type="submit"
                disabled={sending}
              >
                {sending ? <><Spinner /> Sending code…</> : <>Send me a code <span>→</span></>}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-white/60">
              <Icon name="lock" size={15} /> Secure sign-in, no password needed
            </div>
            <p className="mt-4 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-center text-xs text-white/60">
              New to ChatApp? <span className="text-white/80">Your account is created when you verify your email.</span>
            </p>
          </div>

          <footer className="mt-6 text-center text-xs text-white/40">
            © 2026 ChatApp <span>·</span> Made for meaningful conversations
          </footer>
        </section>
      </div>
    </main>
  )
}