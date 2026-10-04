import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from '../components/Avatar'
import Icon from '../components/Icon'
import useAuth from '../hooks/useAuth'
import { updateUserName } from '../services/userService'

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

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="profile-page">
      <header className="profile-topbar">
        <Link className="brand" to="/chat">
          <span className="brand-mark"><Icon name="message" size={22} /></span>
          <span>Chat<span className="brand-accent">App</span></span>
        </Link>
        <Link className="back-link profile-back" to="/chat"><Icon name="arrow" size={17} /> Back to chats</Link>
      </header>
      <section className="profile-card">
        <span className="auth-kicker">YOUR ACCOUNT</span>
        <h1>Profile settings</h1>
        <p className="profile-subtitle">Manage the details people see when they chat with you.</p>
        <div className="profile-identity">
          <Avatar name={user?.name} size="large" />
          <div><strong>{user?.name || 'ChatApp member'}</strong><span>{user?.email}</span></div>
        </div>
        {notice && <p className="form-success" role="status">{notice}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {editing ? (
          <form className="profile-edit-form" onSubmit={saveName}>
            <label htmlFor="profile-name">Display name</label>
            <input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} autoFocus />
            <div className="profile-actions">
              <button className="secondary-button" type="button" onClick={() => { setEditing(false); setError('') }}>Cancel</button>
              <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
            </div>
          </form>
        ) : (
          <div className="profile-detail">
            <div><span>Display name</span><strong>{user?.name || '—'}</strong></div>
            <button className="secondary-button" onClick={() => { setName(user?.name || ''); setEditing(true); setNotice('') }}>
              <Icon name="edit" size={17} /> Edit name
            </button>
          </div>
        )}
        <div className="profile-detail email-detail">
          <div><span>Email address</span><strong>{user?.email || '—'}</strong></div>
          <span className="verified-label"><Icon name="check" size={14} /> Verified</span>
        </div>
        <button className="logout-button" onClick={handleLogout}><Icon name="logout" size={18} /> Sign out</button>
        <p className="profile-note">Your avatar is generated from your initials. Profile photos aren’t supported by the current API.</p>
      </section>
    </main>
  )
}
