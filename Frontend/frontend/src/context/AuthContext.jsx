import { useCallback, useEffect, useState } from 'react'
import { AuthContext } from './AuthContextValue'
import {
  clearAuthToken,
  getCookieToken,
  restoreStoredToken,
  storeAuthToken,
} from '../auth/tokenStorage'
import { fetchAccount, verifyOtp as verifyOtpRequest } from '../services/authService'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  const refreshAccount = useCallback(async () => {
    setAuthError('')
    try {
      const token = restoreStoredToken()
      if (!token) {
        setUser(null)
        return null
      }

      const data = await fetchAccount()
      setUser(data?.account || null)
      return data?.account || null
    } catch (error) {
      if (error.status === 401) {
        clearAuthToken()
        setUser(null)
        return null
      }
      setAuthError(error.message)
      throw error
    }
  }, [])

  useEffect(() => {
    refreshAccount()
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [refreshAccount])

  const verify = async (email, otp) => {
    const data = await verifyOtpRequest(email, otp)
    const token = getCookieToken()
    if (!token) {
      throw new Error(
        'Your code was verified, but the browser could not read the session cookie. Open ChatApp and the backend with the same host name (for example, localhost).',
      )
    }
    storeAuthToken(token)

    const verifiedUser = data?.user || null
    if (!verifiedUser) {
      clearAuthToken()
      throw new Error('Your code was verified, but the server did not return your account.')
    }
    setAuthError('')
    setUser(verifiedUser)
    return verifiedUser
  }

  const logout = () => {
    clearAuthToken()
    sessionStorage.removeItem('chatapp-otp-email')
    sessionStorage.removeItem('chatapp-otp-requested-at')
    setAuthError('')
    setUser(null)
  }

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null)
      setAuthError('')
    }
    window.addEventListener('chatapp:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('chatapp:unauthorized', handleUnauthorized)
  }, [])

  const updateUser = (nextUser) => setUser(nextUser)

  return (
    <AuthContext.Provider value={{ user, loading, authError, verify, refreshAccount, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
