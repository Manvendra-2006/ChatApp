import { Navigate, Outlet } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function ProtectedRoute() {
  const { user, loading, authError, refreshAccount } = useAuth()

  if (loading) {
    return (
      <main className="route-loading" aria-label="Loading your account">
        <span className="spinner" />
        <span>Getting things ready…</span>
      </main>
    )
  }

  if (authError) {
    return (
      <main className="route-loading route-loading-error" role="alert">
        <span>{authError}</span>
        <button className="primary-button" onClick={() => refreshAccount().catch(() => {})}>
          Try again
        </button>
      </main>
    )
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />
}
