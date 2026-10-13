const userApiUrl = import.meta.env.VITE_USER_API_URL?.trim()
const chatApiUrl = import.meta.env.VITE_CHAT_API_URL?.trim()

// Render free services sleep when idle and take up to ~60s to wake.
// 502/503/504 from the gateway mean "upstream not ready yet" -> retry.
const RETRY_STATUSES = new Set([502, 503, 504])
const RETRY_DELAYS_MS = [4000, 8000, 12000]
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Call once on app start: wakes gateway + all services while the user types.
export function warmUpBackend() {
  const base = userApiUrl?.replace(/\/+$/, '')
  if (!base) return
  fetch(`${base}/warmup`).catch(() => {})
}

async function fetchWithRetry(url, options) {
  const isGet = (options.method || 'GET').toUpperCase() === 'GET'

  for (let attempt = 0; ; attempt++) {
    const canRetry = attempt < RETRY_DELAYS_MS.length
    try {
      const res = await fetch(url, options)
      if (RETRY_STATUSES.has(res.status) && canRetry) {
        await sleep(RETRY_DELAYS_MS[attempt])
        continue
      }
      return res
    } catch (error) {
      // Network error: only auto-retry GET (a POST may already have been processed)
      if (isGet && canRetry) {
        await sleep(RETRY_DELAYS_MS[attempt])
        continue
      }
      throw error
    }
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}
export async function apiRequest(service, path, options = {}) {
  const baseUrl = service === 'user' ? userApiUrl : chatApiUrl

  const settingName =
    service === 'user' ? 'VITE_USER_API_URL' : 'VITE_CHAT_API_URL'

  if (!baseUrl) {
    throw new Error(
      `Set ${settingName} in Frontend/frontend/.env.local to the backend service URL.`,
    )
  }

  const headers = new Headers(options.headers)

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  let response

  try {
    response = await fetchWithRetry(
      `${baseUrl.replace(/\/+$/, '')}${path}`,
      {
        ...options,
        headers,
        credentials: 'include',
      },
    )
  } catch {
    throw new Error(
      'Could not reach the server. Check your connection and backend service URLs.',
    )
  }

  const contentType = response.headers.get('content-type') || ''

  const data = contentType.includes('application/json')
    ? await response.json()
    : null

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new Event('chatapp:unauthorized'))
    }

    const message =
      response.status === 401
        ? 'Your session has expired. Please sign in again.'
        : data?.message || 'Something went wrong. Please try again.'

    throw new ApiError(message, response.status)
  }

  return data
}
