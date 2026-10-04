export const AUTH_TOKEN_KEY = 'token'

export function getStoredToken() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  return typeof token === 'string' && token.trim() ? token : null
}

export function storeAuthToken(token) {
  if (typeof token !== 'string' || !token.trim()) {
    throw new Error('The server did not provide a valid authentication token.')
  }

  localStorage.setItem(AUTH_TOKEN_KEY, token)
  const storedToken = getStoredToken()
  if (storedToken !== token) {
    throw new Error('The authentication token could not be saved in this browser.')
  }

  return storedToken
}

export function getCookieToken() {
  const tokenCookie = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${AUTH_TOKEN_KEY}=`))

  if (!tokenCookie) return null

  const value = tokenCookie.slice(AUTH_TOKEN_KEY.length + 1)
  if (!value) return null

  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function restoreStoredToken() {
  const storedToken = getStoredToken()
  if (storedToken) return storedToken

  const cookieToken = getCookieToken()
  return cookieToken ? storeAuthToken(cookieToken) : null
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  document.cookie = `${AUTH_TOKEN_KEY}=; Max-Age=0; path=/; SameSite=Lax`
}
