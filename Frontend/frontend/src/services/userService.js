import { apiRequest } from '../api/apiClient'

export async function fetchUsers() {
  const data = await apiRequest('user', '/api/user/AllUser')
  return Array.isArray(data?.ALLUser) ? data.ALLUser : []
}

export function updateUserName(updatedName) {
  return apiRequest('user', '/api/user/update', {
    method: 'PATCH',
    body: JSON.stringify({ updatedName }),
  })
}
