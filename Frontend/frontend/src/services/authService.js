import { apiRequest } from '../api/apiClient'

export function requestOtp(email) {
  return apiRequest('user', '/api/user/login', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function verifyOtp(email, otp) {
  return apiRequest('user', '/api/user/verify', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  })
}

export function logout() {
  return apiRequest('user', '/api/user/logout', {
    method: 'POST',
  })
}

export function fetchAccount() {
  return apiRequest('user', '/api/user/account')
}
