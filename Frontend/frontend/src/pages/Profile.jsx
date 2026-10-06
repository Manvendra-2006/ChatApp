import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from '../components/Avatar'
import Icon from '../components/Icon'
import useAuth from '../hooks/useAuth'
import { updateUserName } from '../services/userService'

const secondaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50'

export default function Profile() {
  const { user, logout, updateUser } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const saveName = async (event) => {
    event.preventDefault()
    const updatedName = name.trim()
    if (!updatedName) {
      setError('Please enter your name.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateUserName(updatedName)
      updateUser({ ...user, name: updatedName })
      setNotice('Your name has been updated.')
      setEditing(false)
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    setError('')
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (logoutError) {
      setError(logoutError.message)
    }
  }

  return (
    <main className="relative flex min-h-screen w-full flex-col overflow-hidden bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 px-4 py-4 md:px-8 md:py-6">
      {/* decorative blurred blobs, give the glass something to blur */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-cyan-400/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 h-[28rem] w-[28rem] rounded-full bg-pink-500/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-indigo-400/40 blur-3xl" />

      <header className="relative z-10 mx-auto flex w-full max-w-2xl items-center justify-between rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-xl shadow-black/20 backdrop-blur-2xl">
        <Link className="flex items-center gap-3 text-xl font-bold text-white" to="/chat">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-400 to-indigo-500 text-white shadow-lg shadow-fuchsia-900/30">
            <Icon name="message" size={22} />
          </span>
          <span>
            Chat<span className="bg-gradient-to-r from-cyan-200 to-pink-200 bg-clip-text text-transparent">App</span>
          </span>
        </Link>
        <Link className={secondaryBtn} to="/chat">
          <Icon name="arrow" size={17} className="rotate-180" /> Back to chats
        </Link>
      </header>

      <section className="relative z-10 mx-auto my-6 w-full max-w-2xl rounded-3xl border border-white/20 bg-white/10 p-6 text-white shadow-2xl shadow-black/25 backdrop-blur-2xl sm:p-10">
        <span className="text-xs font-semibold tracking-[0.25em] text-cyan-200">YOUR ACCOUNT</span>
        <h1 className="mt-3 text-3xl font-bold">Profile settings</h1>
        <p className="mt-2 text-sm text-white/70">Manage the details people see when they chat with you.</p>

        <div className="mt-8 flex items-center gap-4 rounded-2xl border border-white/20 bg-white/10 p-4">
          <Avatar name={user?.name} size="large" />
          <div className="flex min-w-0 flex-col">
            <strong className="truncate text-lg font-semibold">{user?.name || 'ChatApp member'}</strong>
            <span className="truncate text-sm text-white/60">{user?.email}</span>
          </div>
        </div>

        {notice && (
          <p className="mt-4 rounded-xl border border-emerald-300/40 bg-emerald-500/20 px-4 py-2 text-sm text-emerald-100" role="status">{notice}</p>
        )}
        {error && (
          <p className="mt-4 rounded-xl border border-rose-300/40 bg-rose-500/20 px-4 py-2 text-sm text-rose-100" role="alert">{error}</p>
        )}

        {editing ? (
          <form className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/20 bg-white/10 p-4" onSubmit={saveName}>
            <label className="text-sm font-medium text-white/90" htmlFor="profile-name">Display name</label>
            <input
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/40 focus:border-white/50 focus:bg-white/15"
              id="profile-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              autoFocus
            />
            <div className="mt-1 flex justify-end gap-2">
              <button className={secondaryBtn} type="button" onClick={() => { setEditing(false); setError('') }}>Cancel</button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-900/30 transition hover:scale-[1.03] hover:shadow-fuchsia-500/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                type="submit"
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/20 bg-white/10 p-4">
            <div className="flex min-w-0 flex-col">
              <span className="text-xs text-white/60">Display name</span>
              <strong className="truncate font-semibold">{user?.name || '—'}</strong>
            </div>
            <button className={secondaryBtn} onClick={() => { setName(user?.name || ''); setEditing(true); setNotice('') }}>
              <Icon name="edit" size={17} /> Edit name
            </button>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/20 bg-white/10 p-4">
          <div className="flex min-w-0 flex-col">
            <span className="text-xs text-white/60">Email address</span>
            <strong className="truncate font-semibold">{user?.email || '—'}</strong>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-300/40 bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-100">
            <Icon name="check" size={14} /> Verified
          </span>
        </div>

        <button
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-300/30 bg-rose-500/20 px-4 py-3 font-semibold text-rose-100 transition hover:bg-rose-500/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/60"
          onClick={handleLogout}
        >
          <Icon name="logout" size={18} /> Sign out
        </button>

        <p className="mt-5 text-center text-xs text-white/40">
          Your avatar is generated from your initials. Profile photos aren’t supported by the current API.
        </p>
      </section>
    </main>
  )
}