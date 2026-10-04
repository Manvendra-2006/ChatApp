import { apiRequest } from '../api/apiClient'

export async function fetchMessages(chatId) {
  const data = await apiRequest(
    'chat',
    `/api/chat/getMessagesByChat/${encodeURIComponent(chatId)}`,
  )
  return {
    messages: Array.isArray(data?.messages) ? data.messages : [],
    user: data?.user?.user || data?.user || null,
  }
}

export function sendMessage({ chatId, text, file }) {
  const body = new FormData()
  body.set('chatId', chatId)
  if (text) body.set('text', text)
  if (file) body.set('file', file)

  return apiRequest('chat', '/api/chat/sendMessage', {
    method: 'POST',
    body,
  })
}
