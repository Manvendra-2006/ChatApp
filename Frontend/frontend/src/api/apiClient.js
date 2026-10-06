// const userApiUrl = import.meta.env.VITE_USER_API_URL?.trim()
// const chatApiUrl = import.meta.env.VITE_CHAT_API_URL?.trim()

// export class ApiError extends Error {
//   constructor(message, status) {
//     super(message)
//     this.name = 'ApiError'
//     this.status = status
//   }
// }
// export async function apiRequest(service, path, options = {}) {
//   const baseUrl = service === 'user' ? userApiUrl : chatApiUrl

//   const settingName =
//     service === 'user' ? 'VITE_USER_API_URL' : 'VITE_CHAT_API_URL'

//   if (!baseUrl) {
//     throw new Error(
//       `Set ${settingName} in Frontend/frontend/.env.local to the backend service URL.`,
//     )
//   }

//   const headers = new Headers(options.headers)

//   if (options.body && !(options.body instanceof FormData)) {
//     headers.set('Content-Type', 'application/json')
//   }

//   let response

//   try {
//     response = await fetch(
//       `${baseUrl.replace(/\/+$/, '')}${path}`,
//       {
//         ...options,
//         headers,
//         credentials: 'include',
//       },
//     )
//   } catch {
//     throw new Error(
//       'Could not reach the server. Check your connection and backend service URLs.',
//     )
//   }

//   const contentType = response.headers.get('content-type') || ''

//   const data = contentType.includes('application/json')
//     ? await response.json()
//     : null

//   if (!response.ok) {
//     if (response.status === 401) {
//       window.dispatchEvent(new Event('chatapp:unauthorized'))
//     }

//     const message =
//       response.status === 401
//         ? 'Your session has expired. Please sign in again.'
//         : data?.message || 'Something went wrong. Please try again.'

//     throw new ApiError(message, response.status)
//   }

//   return data
// }
const userApiUrl = import.meta.env.VITE_USER_API_URL?.trim()
const chatApiUrl = import.meta.env.VITE_CHAT_API_URL?.trim()

export async function apiRequest(service, path, options = {}) {
  const baseUrl =
    service === 'user'
      ? userApiUrl
      : chatApiUrl

  const headers = new Headers(options.headers)

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(
    `${baseUrl.replace(/\/+$/, '')}${path}`,
    {
      ...options,
      headers,
      credentials: 'include',
    }
  )

  const contentType = response.headers.get('content-type') || ''

  const data = contentType.includes('application/json')
    ? await response.json()
    : null

  if (!response.ok) {
    throw new Error(
      data?.message || `Request failed with status ${response.status}`
    )
  }

  return data
}